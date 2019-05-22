/**
 * JS image resize
 * v 1.0
 *
 * did NOT need jQuery! (only the demo.html)
 *
 * @author (c) Copyright 2014 Wolf Wortmann <wolf.wolfgang-m.de> / <wolf@wolfgang-m.de>
 * @copyright Feel free to use, modify and redistribute this code. But please keep this copyright notice. (c) Copyright 2014 Wolf Wortmann <http://wolf.wolfgang-m.de> / <wolf@wolfgang-m.de>
 *
 */
function resize_file(file, maxSize, callback){
    var reader = new FileReader();
    //test for filetype
    if (!/image\/(jpeg|jpg|png|gif)/.test(file.type)) {
        alert('File type "'+ file.type +'" is not supported.');
        return false;
    }
    reader.onload = function (e) {
        // resize readed image
        resize_dataUrl(e.target.result, maxSize, callback);
    }
    reader.readAsDataURL(file);
}
function resize_dataUrl(dataURL, maxSize, callback){
    var image = new Image();
    image.onload = function (imageEvent) {
        // Resize image
        var canvas = document.createElement('canvas'),
            width = image.width,
            height = image.height;
        if (width > height) {
            if (width > maxSize) {
                height *= maxSize / width;
                width = maxSize;
            }
        }
        else {
            if (height > maxSize) {
                width *= maxSize / height;
                height = maxSize;
            }
        }
        // Draw resized image in canvas
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(image, 0, 0, width, height);

        // And read the resized image from the canvas (return data to callback function as param)
        callback(canvas.toDataURL('image/jpeg', 1));
    }
    image.src = dataURL;
}
