"use strict";

var keyControllArmed = false;
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
var procImgs = -1;
var Images = [];

/* initialize ui */
function initUI() {
    let obj;
    
    document.addEventListener("keydown",keyPush);
    document.addEventListener("mousedown",function() {keyControllArmed = false;});
    
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
    document.getElementById("savepng").addEventListener("click", processPNG);    
    document.getElementById("discardpng").addEventListener("click", function(e) { 
        e.preventDefault(); 
        document.getElementById("exportbox").classList.add("hidden"); 
    });  
    
    window.onbeforeunload = function() {
        return "Beim verlassen der Seite gehen ungespeicherte Projektdaten verloren. Seite jetzt wirklich verlassen?";
    };
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

/* start generating svg */
function generate() {
    let obj;
    let file;
    
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
    document.getElementById("svgbox").innerHTML = svgGenerator(true, Images, false);

    /* download button with full svg */
    obj = document.getElementById("savesvg");
    file = new Blob([svgGenerator(false, Images, false)], {type: "text/plain"});
    obj.href = URL.createObjectURL(file);
    obj.download = "collage.svg";
    
    /* download button to download project */
    obj = document.getElementById("saveprj");
    file = new Blob([makeJSONObj()], {type: "text/plain"});
    obj.href = URL.createObjectURL(file);
    obj.download = "collagePrj.collage";
}   

/* create SVG */
function svgGenerator(preview, imgCollection, fullRes) {
    /* set adhoc parameters for scaling (preview) */
    let cWidth = collageWidth;
    let cHeight = collageHeight;
    let iXMargin = XMargin;
    let iYMargin = YMargin;
    let ret = "";
    let rElement;
    let addElement;    
    let eSth = SubTitleHeight;
    
    if (preview) {
        cWidth = 800;
        cHeight = cWidth * (collageHeight / collageWidth);
        iXMargin = iXMargin * cWidth / collageWidth;
        iYMargin = iYMargin * cHeight / collageHeight;
        
        eSth = (SubTitleHeight / collageHeight) * cHeight;
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
            if (iimg < imgCollection.length) {
                eW = Math.round(xpos[x + 1]) * imgCollection[iimg].XSpan + (2 * iXMargin) * (imgCollection[iimg].XSpan - 1);
                eH = Math.round(ypos[y + 1]) * imgCollection[iimg].YSpan + (2 * iYMargin) * (imgCollection[iimg].YSpan - 1) + (eSth) * (imgCollection[iimg].YSpan - 1);

                eX = Math.round(-xpos[x + 1] / 2);
                eY = Math.round(-ypos[y + 1] / 2);

                eTransX = Math.round(xpos[x] + xpos[x + 1] / 2);            
                eTransY = Math.round(ypos[y] + ypos[y + 1] / 2);
                eRot = Math.round(getRndInteger(RotRange[0], RotRange[1]));
                
                if (iimg < imgCollection.length && imgCollection[iimg].Visible && !imgCollection[iimg].Error) {      
                    let iFile = imgCollection[iimg].FileName;
                    let cHandler = ""; 
                    
                    if (preview) {
                        iFile = imgCollection[iimg].Preview;                        
                        cHandler = "onClick=\"selImage('" + iimg + "', this)\"";
                    }
                    
                    if (fullRes) {
                        iFile = imgCollection[iimg].FullImg;
                    }
                    
                    ret += "<rect x='" + eX + "px' y='" + eY + "' width='" + eW + "px' height='" + (eH + eSth) + "px' transform='translate(" + eTransX +  " " + eTransY + ") rotate(" + eRot + ")' style='fill:" + ImgBackColor + ";'/>";
                    
                    ret += "<image xlink:href='" + iFile + "' x='" + eX + "px' y='" + eY + "' width='" + eW + "px' height='" + eH + "px' transform='translate(" + eTransX +  " " + eTransY + ") rotate(" + eRot + ") scale(" + ImgScale + ")' preserveAspectRatio='xMidYMid slice' " + cHandler + "/>";
                    
                    if (eSth > 0) {
                        ret += "<text x='" + (eX + 5) + "px' y='" + (eY + eH + (eSth * 0.8)) + "px' alignment-baseline='middle' text-anchor='left' transform='translate(" + eTransX +  " " + eTransY + ") rotate(" + eRot + ")'><tspan style='fill:" + TextColor + ";font-family:Arial,Verdana,sans-serif;font-size:" + (eSth * 0.8) + "'>" + imgCollection[iimg].SubTitle + "</tspan></text>"; 
                    }
                }
                
                if (Selection == iimg && preview) {
                    ret += "<rect x='" + eX + "px' y='" + eY + "' width='" + eW + "px' height='" + (eH + eSth) + "px' transform='translate(" + eTransX +  " " + eTransY + ") rotate(" + eRot + ")' style='fill:none;stroke:lime;stroke-width:3px;stroke-dasharray:15,15'/>";
                }

                iimg++;                
            }
        }
    }
    ret += "</svg>";
    
    return ret;
}

/* start processing of export PNG */
function processPNG(e) {
    e.preventDefault();
    
    /* check if all images are available */    
    if (procImgs == 0) {  
        document.getElementById("exportbox").classList.remove("hidden");
        document.getElementById("savepnglink").classList.add("hidden");
        document.getElementById("discardpng").classList.add("hidden");
        document.getElementById("exportmsg").innerHTML = "Die Collage wird erstellt ...";
        
        setTimeout(function() { exportPNG(); }, 100);
    }
}

/* export PNG */
function exportPNG() {    
    let obj;
    let file;
    
    /* test direct jpg dl */
    let cvas = document.createElement('canvas');
    cvas.setAttribute("id", "cvas");
    cvas.setAttribute("width", collageWidth);
    cvas.setAttribute("height", collageHeight);
    document.getElementById('canvasbox').innerHTML = "";
    document.getElementById('canvasbox').appendChild(cvas);
    
    var svgImg = new Image();
    svgImg.onload= function() {     
        let cvas = document.getElementById('cvas');        
        if (cvas) {            
            cvas.getContext("2d").drawImage(svgImg, 0, 0);        
            
            cvas.toBlob(function(blob) {                
                /* download button with png */                
                obj = document.getElementById("savepnglink");
                obj.href = URL.createObjectURL(blob);
                obj.download = "collage.png";    
                document.getElementById("exportmsg").innerHTML = "Die Collage ist bereit zum speichern ...";
                obj.classList.remove("hidden");
                document.getElementById("discardpng").classList.remove("hidden");
                obj.addEventListener("click", function() {
                    document.getElementById("exportbox").classList.add("hidden");
                });
            });                
        }
    }
    
    svgImg.src = 'data:image/svg+xml;base64,' + btoa(svgGenerator(false, Images, true));    
}

/* state progress of image importing */
function ShowImpProgress() {
    procImgs = 0;
    for (let i = 0; i < Images.length; i++) {        
        if (Images[i].Processing) {
            procImgs ++;
        }
        if (Images[i].FullImgProcessing) {
            procImgs ++;
        }
    }
    
    let percProc = (Images.length * 2 - procImgs) / (Images.length * 2);
    
    if (procImgs > 0) {
        document.getElementById("saveprj").classList.add("hidden");
        document.getElementById("savepng").classList.add("hidden");      
        
        document.getElementById("progressbox").classList.remove("hidden");
        document.getElementById("ImgDataState").classList.remove("hidden");
        
        // Draw progress bar        
        let pbcanvas = document.getElementById("ImgDataState");
        let ctx = pbcanvas.getContext("2d");    
        ctx.fillStyle = 'dimgray';
        ctx.clearRect(0, 0, pbcanvas.width, pbcanvas.height);
        ctx.fillRect(0, 0, pbcanvas.width, pbcanvas.height);

        ctx.fillStyle = 'CornflowerBlue';    
        ctx.fillRect(0, 0, pbcanvas.width * (percProc), pbcanvas.height);

        ctx.fillStyle = 'white';
        ctx.font = "20px Arial";
        ctx.fillText("Bearbeite Bilder - " + Math.ceil(percProc * 100) + "% ", 5, pbcanvas.height / 2 + 6);
    } else {
        document.getElementById("saveprj").classList.remove("hidden");
        document.getElementById("savepng").classList.remove("hidden");        
        
        document.getElementById("progressbox").classList.add("hidden");
        document.getElementById("ImgDataState").classList.add("hidden");
        
        generateImgListEditor();
    }    
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
        
        setImgPreview(cImg, 400);
    }
    
    ShowImpProgress();
    
    generateImgListEditor();
}

/* generate image preview and callback generator */
function setImgPreview(cImg, res) {
    if (cImg.File) {
        resize_file(cImg.File, res, function (resizedDataUrl) { 
            cImg.Preview = resizedDataUrl; 
            cImg.Processing = false; 
            if (resizedDataUrl == "ERR") {
                cImg.Error = true;
            }
            ShowImpProgress(); 
            generateImgListEditor();             
            setFullImageData(cImg, 1280);            
        });            
    }
}

/* generate full images for export and callback exporter */
function setFullImageData(cImg, res) {
    if (cImg.File && cImg.Visible) {
        resize_file(cImg.File, res, function (resizedDataUrl) { 
            cImg.FullImg = resizedDataUrl; 
            cImg.FullImgProcessing = false; 
            if (resizedDataUrl == "ERR") {
                cImg.Error = true;
            }
            ShowImpProgress(); 
        });            
    } else {
        cImg.FullImgProcessing = false;         
        ShowImpProgress(); 
    }
}

/*add placeholder */
function addPlaceHolder() {
    
    let i = Images.length - 1;
    if (Selection > -1) {
        i = Selection;
        
        if (i >= Images.length) {
            i = Images.length - 1;
        }
    }
    
    if (i < 0) {
        i = 0;
    }
    
    Images.splice(i, 0, new CollageImage(null, "frei", "", false));    
        
    generateImgListEditor();
}

/* image list editor - select */
function selImage(nr, sender) {   
    if (Selection > -1 && Selection < Images.length) {
        document.getElementById("editorRow" + Selection).classList.toggle("rowSelected");    
    }
    Selection = parseInt(nr, 10);    
    document.getElementById("editorRow" + Selection).classList.toggle("rowSelected");
    
    keyControllArmed = true;
    
    generate();
}

/* user key controll events */
function keyPush(evt) {
    return; /* disabled - prevent controlling by keys if the keys are needed from another controll... */
    if (!keyControllArmed) {
        return;
    }
    
    switch(evt.keyCode) {
        case 37:
            upImage("Gen");
            break;
        case 38:
            upImage("Gen");
            break;
        case 39:
            downImage("Gen");
            break;
        case 40:
            downImage("Gen");
            break;
        case 46:
            delImage("Gen");
            break;
	}
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

/* set colors from selection */
function setColors() {
    generate();
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
        iObj ["FullImg"] = Images[i].FullImg;
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
        Images[i-1].FullImg = jsonObj[i].FullImg;        
        Images[i-1].XSpan = jsonObj[i].XSpan;
        Images[i-1].YSpan = jsonObj[i].YSpan;
        Images[i-1].Error = jsonObj[i].Error;
        Images[i-1].Processing = false;        
        Images[i-1].FullImgProcessing = false;        
    }
    
    generateImgListEditor();
    
    ShowImpProgress();
}

/*helper and classes*/
function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1) ) + min;
}

/* image data container */
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
        this.FullImg;
        this.FullImgProcessing = visible;
    }
}

/* all html color names */
var HtmlColorNames = ["AliceBlue","AntiqueWhite","Aqua","Aquamarine","Azure","Beige","Bisque","Black","BlanchedAlmond","Blue","BlueViolet","Brown","BurlyWood","CadetBlue","Chartreuse","Chocolate","Coral","CornflowerBlue","Cornsilk","Crimson","Cyan","DarkBlue","DarkCyan","DarkGoldenRod","DarkGray","DarkGrey","DarkGreen","DarkKhaki","DarkMagenta","DarkOliveGreen","Darkorange","DarkOrchid","DarkRed","DarkSalmon","DarkSeaGreen","DarkSlateBlue","DarkSlateGray","DarkSlateGrey","DarkTurquoise","DarkViolet","DeepPink","DeepSkyBlue","DimGray","DimGrey","DodgerBlue","FireBrick","FloralWhite","ForestGreen","Fuchsia","Gainsboro","GhostWhite","Gold","GoldenRod","Gray","Grey","Green","GreenYellow","HoneyDew","HotPink","IndianRed","Indigo","Ivory","Khaki","Lavender","LavenderBlush","LawnGreen","LemonChiffon","LightBlue","LightCoral","LightCyan","LightGoldenRodYellow","LightGray","LightGrey","LightGreen","LightPink","LightSalmon","LightSeaGreen","LightSkyBlue","LightSlateGray","LightSlateGrey","LightSteelBlue","LightYellow","Lime","LimeGreen","Linen","Magenta","Maroon","MediumAquaMarine","MediumBlue","MediumOrchid","MediumPurple","MediumSeaGreen","MediumSlateBlue","MediumSpringGreen","MediumTurquoise","MediumVioletRed","MidnightBlue","MintCream","MistyRose","Moccasin","NavajoWhite","Navy","OldLace","Olive","OliveDrab","Orange","OrangeRed","Orchid","PaleGoldenRod","PaleGreen","PaleTurquoise","PaleVioletRed","PapayaWhip","PeachPuff","Peru","Pink","Plum","PowderBlue","Purple","Red","RosyBrown","RoyalBlue","SaddleBrown","Salmon","SandyBrown","SeaGreen","SeaShell","Sienna","Silver","SkyBlue","SlateBlue","SlateGray","SlateGrey","Snow","SpringGreen","SteelBlue","Tan","Teal","Thistle","Tomato","Turquoise","Violet","Wheat","White","WhiteSmoke","Yellow","YellowGreen"];