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
var ImgBackColor = "black";
var BackgroundColor = "white";
var TextColor = "white";
var Selection = -1;
var HtmlColorNames = ["AliceBlue","AntiqueWhite","Aqua","Aquamarine","Azure","Beige","Bisque","Black","BlanchedAlmond","Blue","BlueViolet","Brown","BurlyWood","CadetBlue","Chartreuse","Chocolate","Coral","CornflowerBlue","Cornsilk","Crimson","Cyan","DarkBlue","DarkCyan","DarkGoldenRod","DarkGray","DarkGrey","DarkGreen","DarkKhaki","DarkMagenta","DarkOliveGreen","Darkorange","DarkOrchid","DarkRed","DarkSalmon","DarkSeaGreen","DarkSlateBlue","DarkSlateGray","DarkSlateGrey","DarkTurquoise","DarkViolet","DeepPink","DeepSkyBlue","DimGray","DimGrey","DodgerBlue","FireBrick","FloralWhite","ForestGreen","Fuchsia","Gainsboro","GhostWhite","Gold","GoldenRod","Gray","Grey","Green","GreenYellow","HoneyDew","HotPink","IndianRed","Indigo","Ivory","Khaki","Lavender","LavenderBlush","LawnGreen","LemonChiffon","LightBlue","LightCoral","LightCyan","LightGoldenRodYellow","LightGray","LightGrey","LightGreen","LightPink","LightSalmon","LightSeaGreen","LightSkyBlue","LightSlateGray","LightSlateGrey","LightSteelBlue","LightYellow","Lime","LimeGreen","Linen","Magenta","Maroon","MediumAquaMarine","MediumBlue","MediumOrchid","MediumPurple","MediumSeaGreen","MediumSlateBlue","MediumSpringGreen","MediumTurquoise","MediumVioletRed","MidnightBlue","MintCream","MistyRose","Moccasin","NavajoWhite","Navy","OldLace","Olive","OliveDrab","Orange","OrangeRed","Orchid","PaleGoldenRod","PaleGreen","PaleTurquoise","PaleVioletRed","PapayaWhip","PeachPuff","Peru","Pink","Plum","PowderBlue","Purple","Red","RosyBrown","RoyalBlue","SaddleBrown","Salmon","SandyBrown","SeaGreen","SeaShell","Sienna","Silver","SkyBlue","SlateBlue","SlateGray","SlateGrey","Snow","SpringGreen","SteelBlue","Tan","Teal","Thistle","Tomato","Turquoise","Violet","Wheat","White","WhiteSmoke","Yellow","YellowGreen"];

var Images = [];
class CollageImage {     
    constructor(file, filename, subtitle, visible) {     
        this.File = file;
        this.FileName = filename; 
        this.SubTitle = subtitle; 
        this.Visible = visible;  
        this.XSpan = 1;
        this.YSpan = 1;
        if (visible) {
            this.Preview = getProcessingGif();
        }
        this.Processing = visible;
        this.Error = false;
    }
}


/* initialize ui */
function initUI() {
    let obj;
    
    obj = document.getElementsByClassName("colorSelect");
    for (let i = 0; i < obj.length; i++)
    {        
        /* <option value="1000">1:1</option> */
        for (let c = 0; c < HtmlColorNames.length; c++) {
            let oElement = document.createElement("option");
            oElement.innerHTML = HtmlColorNames[c];
            oElement.setAttribute("value", HtmlColorNames[c]);
            
            obj[i].appendChild(oElement);			
        }
        	
    }
    
    obj = document.getElementsByClassName("paramField");
    for (let i = 0; i < obj.length; i++)
    {        
        obj[i].addEventListener("keyup", generate);			
        obj[i].addEventListener("mouseup", generate);		
    }
    
    document.getElementById("collagePrjFile").addEventListener("change", loadPrj);
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
    BackgroundColor = document.getElementById("BGColor").value;
    ImgBackColor = document.getElementById("ImgBgColor").value;
    TextColor = document.getElementById("StTxtColor").value;
    
    /* preview insertion */
    document.getElementById("svgbox").innerHTML = svgGenerator(true);

    let obj;
    let file;
    
    /* download button with full svg */
    obj = document.getElementById("savesvg");
    file = new Blob([svgGenerator(false)], {type: "text/plain"});
    obj.href = URL.createObjectURL(file);
    obj.download = "collage.svg";
    
    /* download button to download project */
    obj = document.getElementById("saveprj");
    file = new Blob([makeJSONObj()], {type: "text/plain"});
    obj.href = URL.createObjectURL(file);
    obj.download = "collagePrj.collage";
}

function svgGenerator(preview) {
    /* set adhoc parameters for scaling (preview) */
    let cWidth = collageWidth;
    let cHeight = collageHeight;
    let iXMargin = XMargin;
    let iYMargin = YMargin;
    let ret = "";
    let rElement;
    let addElement;
    
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
    ret += "<rect x='0' y= '0' width='" + cWidth + "' height='" + cHeight + "' style='fill:" + BackgroundColor + ";stroke:none' />";
    
    /* draw collage boxes */
    
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

                if (iimg < Images.length && Images[iimg].Visible && !Images[iimg].Error) {      
                    let iFile = Images[iimg].FileName;
                    let cHandler = ""; 
                    
                    if (preview) {
                        iFile = Images[iimg].Preview;                        
                        cHandler = "onClick=\"selImage('" + iimg + "', this)\"";
                    }
                    
                    ret += "<rect x='" + eX + "px' y='" + eY + "' width='" + eW + "px' height='" + (eH + SubTitleHeight) + "px' transform='translate(" + eTransX +  " " + eTransY + ") rotate(" + eRot + ")' style='fill:" + ImgBackColor + ";'/>";
                    
                    ret += "<image xlink:href='" + iFile + "' x='" + eX + "px' y='" + eY + "' width='" + eW + "px' height='" + eH + "px' transform='translate(" + eTransX +  " " + eTransY + ") rotate(" + eRot + ") scale(" + ImgScale + ")' preserveAspectRatio='xMidYMid slice' " + cHandler + "/>";
                    
                    if (SubTitleHeight > 0) {
                        ret += "<text x='" + (eX + 5) + "px' y='" + (eY + eH + 15) + "px' alignment-baseline='middle' text-anchor='left' transform='translate(" + eTransX +  " " + eTransY + ") rotate(" + eRot + ")'><tspan style='fill:" + TextColor + ";font-size:15px'>" + Images[iimg].SubTitle + "</tspan></text>";                
                    }
                }
                
                if (Selection == iimg && preview) {
                    
                    ret += "<rect x='" + eX + "px' y='" + eY + "' width='" + eW + "px' height='" + (eH + SubTitleHeight) + "px' transform='translate(" + eTransX +  " " + eTransY + ") rotate(" + eRot + ")' style='fill:none;stroke:blue;stroke-width:3px;stroke-dasharray:15,15'/>";
                }

                iimg++;
            }
        }
    }
    ret += "</svg>";
    
    return ret;
}

/* set colors from selection */
function setColors() {
    generate();
}

/* generate image preview and callback generator */
function setImgPreview(cImg) {
    if (cImg.File) {
        resize_file(cImg.File, 400, function (resizedDataUrl) { 
            cImg.Preview = resizedDataUrl; 
            cImg.Processing = false; 
            if (resizedDataUrl == "ERR") {
                cImg.Error = true;
            }
            generateImgListEditor(); 
        });            
    }
}


/*add placeholder */
function addPlaceHolder() {
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
    
    generateImgListEditor();
}

/* build the image list editor */
function generateImgListEditor() {
    document.getElementById("dropzone").innerHTML = "<table id='imagelisteditor'></table>";
    for (let i = 0; i < Images.length; i++) {
        let rClass = "";
        if (i == Selection) {
            rClass = "rowSelected";
        }
        let html = "<tr onClick=\"selImage('" + i + "', this)\" class='" + rClass + " enHover' id='editorRow" + i + "'><td>" + (i + 1) +  ".</td>";
        html += "<td><b style='color:green;'>" + Images[i].FileName + "</b></td>";
		if (!Images[i].Processing && !Images[i].Error) {
            if (Images[i].Visible) {
                html += "<td>Untertitel: <input class='largeField' type='text' id='subtitle" + i + "' onKeyUp=\"changeSubTitle('" + i + "', this)\" value='" + Images[i].SubTitle + "'> </td>";
                html += "<td>Breite: <input class='smallField' type='number' id='xspan" + i + "' onClick=\"xSpanImage('" + i + "', this)\" value='" + Images[i].XSpan + "'></td>";  
                html += "<td>Höhe: <input class='smallField' type='number' id='yspan" + i + "' onClick=\"ySpanImage('" + i + "', this)\" value='" + Images[i].YSpan + "'></td>";  
            } else  {
                html += "<td></td><td></td><td></td>";
            }
        } else if (Images[i].Error) {
            html += "<td style='color:red;font-weight:bold;'>Vorschau nicht möglich. Kein Bild?</td><td></td><td></td>";        
        } else {
            html += "<td style='color:orange;font-weight:bold;'>Erzeuge Vorschau ...</td><td></td><td></td>";
        }

        html += "<td><button type='button' class='editorbutton up' id='up" + i + "' onClick=\"upImage('" + i + "')\" ><span></span></button>";  
        html += "<button type='button' class='editorbutton dwn' id='down" + i + "' onClick=\"downImage('" + i + "')\"><span></span></button>";
        html += "<button type='button' class='editorbutton del' id='del" + i + "' onClick=\"delImage('" + i + "')\"><span></span></button></td>";  
        html += "</tr>";            

		document.getElementById("imagelisteditor").innerHTML += html;
    }
    
    generate();
}

/* image list editor - select */
function selImage(nr, sender) {   
    if (Selection > -1 && Selection < Images.length) {
        document.getElementById("editorRow" + Selection).classList.toggle("rowSelected");    
    }
    Selection = parseInt(nr, 10);    
    document.getElementById("editorRow" + Selection).classList.toggle("rowSelected");
    
    generate();
}


/* image list editor - delete */
function delImage(nr) {   
    if (nr == "Gen") {
        if (Selection < 0 || Selection > Images.length - 1) {
            return;
        }
        nr = Selection;   
        Selection = -1;
    } else {
        nr = parseInt(nr, 10);
    }
    
    Images.splice(nr, 1);
    generateImgListEditor();    
}

/* image list editor - move up */
function upImage(nr) {    
    if (nr == "Gen") {
        if (Selection < 0 || Selection > Images.length - 1) {
            return;
        }
        nr = Selection;
        if (Selection > 0) {
            Selection--;
        }
    } else {
        nr = parseInt(nr, 10);
    }
    
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
    if (nr == "Gen") {
        if (Selection < 0 || Selection > Images.length - 1) {
            return;
        }
        nr = Selection;   
        if (Selection < Images.length - 1) {            
            Selection++;
        }
    } else {
        nr = parseInt(nr, 10);
    }
    
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
    if (nr == "Gen") {
        nr = Selection;   
    } else {
        nr = parseInt(nr, 10);
    }
    
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

/* create a JSON that contains the projects data. Make it available for saving the current project */
function makeJSONObj() {
    let jsonObj = [];    
    let pObj = {};
    pObj ["collageWidth"] = collageWidth;
    pObj ["collageHeight"] = collageHeight;
    pObj ["columns"] = columns;
    pObj ["maxrows"] = maxrows;
    pObj ["XMargin"] = XMargin;
    pObj ["YMargin"] = YMargin;
    pObj ["SubTitleHeight"] = SubTitleHeight;
    pObj ["AspectRatio"] = AspectRatio;
    pObj ["RotRange"] = RotRange;
    pObj ["ImgBackColor"] = ImgBackColor;
    pObj ["BackgroundColor"] = BackgroundColor;
    pObj ["TextColor"] = TextColor;
    
    jsonObj.push(pObj);
    
    for (let i = 0; i < Images.length; i++) {
        let iObj = {};
        iObj ["FileName"] = Images[i].FileName;
        iObj ["Preview"] = Images[i].Preview;
        iObj ["SubTitle"] = Images[i].SubTitle;
        iObj ["Visible"] = Images[i].Visible;
        iObj ["XSpan"] = Images[i].XSpan;
        iObj ["YSpan"] = Images[i].YSpan;
        iObj ["Error"] = Images[i].Error;
        
        jsonObj.push(iObj);
    }
    
    return JSON.stringify(jsonObj);
}

/* load Project from JSON file */
function loadPrj(e) {
    var file = e.target.files[0];
	
	if (!file) 
	{
		return;
	}
	
	let reader = new FileReader();
	reader.onload = function() 
	{
		var str = reader.result;
		interpretPrj(str);
	};

	reader.readAsText(file); 
}

/* interpret project file */
function interpretPrj(str) {
    let jsonObj = JSON.parse(str);
    
    Images = [];
    
    /* Parameters */
    document.getElementById("collageWidth").value = jsonObj[0].collageWidth;
    document.getElementById("collageHeight").value = jsonObj[0].collageHeight;
    document.getElementById("columns").value = jsonObj[0].columns;
    document.getElementById("maxRows").value = jsonObj[0].maxrows;
    document.getElementById("XMargin").value = jsonObj[0].XMargin;
    document.getElementById("YMargin").value = jsonObj[0].YMargin;
    document.getElementById("SubTitleHeight").value = jsonObj[0].SubTitleHeight;
    document.getElementById("AspectRatio").value = jsonObj[0].AspectRatio * 1000;    
    ImgScale = 1; /*parseInt(document.getElementById("Scale").value, 10) / 100;*/
    document.getElementById("Rotation").value = parseInt(jsonObj[0].RotRange, 10);
    document.getElementById("BGColor").value = jsonObj[0].BackgroundColor;
    document.getElementById("ImgBgColor").value = jsonObj[0].ImgBackColor;
    document.getElementById("StTxtColor").value = jsonObj[0].TextColor;
    
    for (let i = 1; i < jsonObj.length; i++) {
        Images.push(new CollageImage(null, jsonObj[i].FileName, jsonObj[i].SubTitle, jsonObj[i].Visible));
        Images[i-1].Preview = jsonObj[i].Preview;
        Images[i-1].XSpan = jsonObj[i].XSpan;
        Images[i-1].YSpan = jsonObj[i].YSpan;
        Images[i-1].Error = jsonObj[i].Error;
        Images[i-1].Processing = false;        
    }
    
    generateImgListEditor();
}


/*helper*/
function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1) ) + min;
}

