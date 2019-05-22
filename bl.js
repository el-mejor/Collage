"use strict";

var collageWidth = 1000;
var collageHeight = 1000;
var columns = 3;
var maxrows = 3;
var XMargin = 10;
var YMargin = 10;
var SubTitleHeight = 0.0;
var AspectRatio = 3 / 3;
var ImgScale = 0.98;
var RotRange = [0.0, 0.0];
var BackgroundColor = "black";
var TextColor = "white";

var Images = [];
class CollageImage {     
    constructor(file, filename, subtitle, visible) {     
        this.File = file;
        this.FileName = filename; 
        this.SubTitle = subtitle; 
        this.Visible = visible;  
        this.XSpan = 1;
        this.YSpan = 1;
        this.Preview = "";
    }
}

function setImgPreview(cImg) {
    if (cImg.File) {
        resize_file(cImg.File, 400, function (resizedDataUrl) { cImg.Preview = resizedDataUrl; generateImgListEditor(); });            
    }
}

function generate() {
    /* Parameters */
    collageWidth = parseInt(document.getElementById("collageWidth").value, 10);
    collageHeight = parseInt(document.getElementById("collageHeight").value, 10);
    columns = parseInt(document.getElementById("columns").value, 10);
    maxrows = parseInt(document.getElementById("maxRows").value, 10);
    XMargin = parseInt(document.getElementById("XMargin").value, 10);
    YMargin = parseInt(document.getElementById("YMargin").value, 10);
    SubTitleHeight = parseInt(document.getElementById("SubTitleHeight").value, 10);
    AspectRatio = parseInt(document.getElementById("AspectRatio").value, 10) / 1000.0;
    ImgScale = 1; /*parseInt(document.getElementById("Scale").value, 10) / 100;*/
    RotRange = [-parseInt(document.getElementById("Rotation").value, 10), parseInt(document.getElementById("Rotation").value, 10)];
    BackgroundColor = "black";
    TextColor = "white";
    
    /* preview insertion */
    document.getElementById("svgbox").innerHTML = svgGenerator(true);

    /* download button with full svg */
    let obj = document.getElementById("savesvg");
    let file = new Blob([svgGenerator(false)], {type: "text/plain"});
    obj.href = URL.createObjectURL(file);
    obj.download = "collage.svg";
}

function svgGenerator(preview) {
    /* set adhoc parameters for scaling (preview) */
    let cWidth = collageWidth;
    let cHeight = collageHeight;
    let iXMargin = XMargin;
    let iYMargin = YMargin;
    let ret = "";
    
    if (preview) {
        cWidth = 800;
        cHeight = cWidth * (collageHeight / collageWidth);
        iXMargin = iXMargin * cWidth / collageWidth;
        iYMargin = iYMargin * cHeight / collageHeight;
    }
    
    /* xmlns:xlink='http://www.w3.org/1999/xlink' */
    
    /* SVG and preview generation */    
    ret = "<svg version='1.1' baseProfile='full' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' width='" + cWidth + "px' height='" + cHeight + "px' id='svgcollage'>";
    
    /* draw background */
    ret += "<rect x='0' y= '0' width='" + cWidth + "' height='" + cHeight + "' style='fill:white;stroke:black;stroke-width:1px' />";

    /* draw collage boxes */
    if (Images.length == 0) {        
        return "keine Bilder";
    }
    
    let xpos, ypos, eX, eY, eW, eH, eTransX, eTransY, eRot, iimg;
    iimg = 0;
    xpos = getCollageXPos(cWidth, columns, iXMargin);
    ypos = getCollageYPos(cHeight, maxrows, iYMargin, xpos[1] / AspectRatio, SubTitleHeight);
    
    for (let y = 0; y < ypos.length; y += 2) {
        for (let x = 0; x < xpos.length; x += 2) {
            if (iimg < Images.length) {
                eW = Math.round(xpos[x + 1]) * Images[iimg].XSpan + (2 * iXMargin) * (Images[iimg].XSpan - 1);
                eH = Math.round(ypos[y + 1]) * Images[iimg].YSpan + (2 * iYMargin) * (Images[iimg].YSpan - 1) + (SubTitleHeight) * (Images[iimg].YSpan - 1);

                eX = Math.round(-xpos[x + 1] / 2);
                eY = Math.round(-ypos[y + 1] / 2);

                eTransX = Math.round(xpos[x] + xpos[x + 1] / 2);            
                eTransY = Math.round(ypos[y] + ypos[y + 1] / 2);
                eRot = Math.round(getRndInteger(RotRange[0], RotRange[1]));

                if (iimg < Images.length && Images[iimg].Visible) {      
                    let iFile = Images[iimg].FileName;
                    
                    if (preview) {
                        iFile = Images[iimg].Preview;                        
                    }
                    
                    ret += "<rect x='" + eX + "px' y='" + eY + "' width='" + eW + "px' height='" + (eH + SubTitleHeight) + "px' transform='translate(" + eTransX +  " " + eTransY + ") rotate(" + eRot + ")' style='fill:" + BackgroundColor + "'/>";

                    ret += "<image xlink:href='" + iFile + "' x='" + eX + "px' y='" + eY + "' width='" + eW + "px' height='" + eH + "px' transform='translate(" + eTransX +  " " + eTransY + ") rotate(" + eRot + ") scale(" + ImgScale + ")' preserveAspectRatio='xMidYMid slice'/>";

                    ret += "<text x='" + (eX + 5) + "px' y='" + (eY + eH + 15) + "px' alignment-baseline='middle' text-anchor='left' transform='translate(" + eTransX +  " " + eTransY + ") rotate(" + eRot + ")'><tspan style='fill:" + TextColor + ";font-size:15px'>" + Images[iimg].SubTitle + "</tspan></text>";                
                }

                iimg++;
            }
        }
    }
    ret += "</svg>";
    
    return ret;
}

/* initialize ui */
function initUI() {
    let obj = document.getElementsByClassName("paramField");
    for (let i = 0; i < obj.length; i++)
    {        
        obj[i].addEventListener("keyup", generate);			
        obj[i].addEventListener("mouseup", generate);		
    }
}

/*add placeholder */
function addPlaceHOlder() {
    Images.push(new CollageImage(null, "frei", "", false));    
    
    generateImgListEditor();
}

/*on droping imahes*/
function dropImages(e) {
    e.stopPropagation();
    e.preventDefault();
    
    /*var items  = e.dataTransfer.items;      // -- Items

    for (var i = 0; i < items.length; i++)
    {                
      
        console.log(items[i].getAsFile().path);
    }*/
    
    for (var i = 0; i < e.dataTransfer.files.length; i++) {                
        let fName = e.dataTransfer.files[i].name;
        let cImg = new CollageImage(e.dataTransfer.files[i], fName, fName, true);
        Images.push(cImg);        
        
        setImgPreview(cImg);
    }
}

/* build the image list editor */
function generateImgListEditor() {
    document.getElementById("dropzone").innerHTML = "<table id='imagelisteditor'></table>";
    for (let i = 0; i < Images.length; i++) {
        let html = "<tr><td>" + (i + 1) +  ".</td>";
        html += "<td><b style='color:green'>" + Images[i].FileName + "</b></td>";
		if (Images[i].Visible) {
            html += "<td>Untertitel: <input class='largeField' type='text' id='subtitle" + i + "' onKeyUp=\"changeSubTitle('" + i + "', this)\" value='" + Images[i].SubTitle + "'> </td>";
            html += "<td>Breite: <input class='smallField' type='number' id='xspan" + i + "' onClick=\"xSpanImage('" + i + "', this)\" value='" + Images[i].XSpan + "'></td>";  
            html += "<td>Höhe: <input class='smallField' type='number' id='yspan" + i + "' onClick=\"ySpanImage('" + i + "', this)\" value='" + Images[i].YSpan + "'></td>";  
        } else {
            html += "<td></td><td></td><td></td>";
        }
        
		html += "<td><button type='button' class='editorbutton up' id='up" + i + "' onClick=\"upImage('" + i + "')\" ><span></span></button>";  
		html += "<button type='button' class='editorbutton dwn' id='down" + i + "' onClick=\"downImage('" + i + "')\"><span></span></button>";
        html += "<button type='button' class='editorbutton del' id='del" + i + "' onClick=\"delImage('" + i + "')\"><span></span></button></td>";  
		html += "</tr>";
		document.getElementById("imagelisteditor").innerHTML += html;
    }

    generate();
}

/* image list editor - delete */
function delImage(nr) {   
    nr = parseInt(nr, 10);
    Images.splice(nr, 1);
    generateImgListEditor();
}

/* image list editor - move up */
function upImage(nr) {    
    nr = parseInt(nr, 10);
	if (nr == 0) {
        return;
    }
    
    let tmp = Images[nr];
    Images[nr] = Images[nr - 1];
    Images[nr - 1] = tmp;
    
    generateImgListEditor();
}

/* image list editor - move down */
function downImage(nr) {    
    nr = parseInt(nr, 10);
    if (nr == Images.length - 1) {
        return;
    }
    
    let tmp = Images[nr];
    Images[nr] = Images[nr + 1];
    Images[nr + 1] = tmp;   
    
    generateImgListEditor();
}

/* image list editor - change SubTitle */
function changeSubTitle(nr, sender) {
    nr = parseInt(nr, 10);
    Images[nr].SubTitle = sender.value;	
	
	generate();
}

/* image list editor - change span */
function xSpanImage(nr, sender) {
    nr = parseInt(nr, 10);
    Images[nr].XSpan = sender.value;	
	
	generate();
}

/* image list editor - change span */
function ySpanImage(nr, sender) {
    nr = parseInt(nr, 10);
    Images[nr].YSpan = sender.value;	
	
	generate();
}

/* calculate image X positions */
function getCollageXPos(size, partitions, margin) {
    let ret = [];

    let tot = (size / partitions);
    let img = tot - 2 * margin;

    for (let i = 0; i < partitions; i++) {
        var pos = i * tot + margin;
        ret.push(pos, img);                            
    }   

    return ret;
}      

/* calculate image Y positions */
function getCollageYPos(size, maxpartitions, margin, imgheight, subtitle) {
    let ret = [];

    let tot = (imgheight + 2 * margin) + subtitle;            

    for (let i = 0; i < maxpartitions; i++) {
        let pos = i * tot + margin;
        if (pos + tot > size) {
            break;        
        }
        ret.push(pos, imgheight);
    }

    return ret;
}  

/*helper*/
function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1) ) + min;
}