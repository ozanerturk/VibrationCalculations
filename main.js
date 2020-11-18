define(function (require) {
    // Load any app-specific modules
    // with a relative require call,
    // like:
    let file = document.getElementById("file");
    let downloadSample = document.getElementById("downloadSample");
    let results = document.getElementById("results");

    var signalProcessor = require('./signalProcessing')({ tf: tf });
    var exampleData = require('./signaldata');
    const reader = new FileReader();

    downloadSample.addEventListener("click",()=>{
            var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exampleData));
            var downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href",     dataStr);
            downloadAnchorNode.setAttribute("download", "6000Hz_100Hz" + ".json");
            document.body.appendChild(downloadAnchorNode); // required for firefox
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
    })

    file.addEventListener("change", (event) => {
        const fileList = event.target.files;
        reader.readAsDataURL(fileList[0]);
    })

    reader.addEventListener('load', (event) => {
        console.log()
        const data = JSON.parse(atob(event.target.result.split("data:application/json;base64,")[1]));
        let dataX = data.data.accelerometer_x
        let dataY = data.data.accelerometer_y
        let dataZ = data.data.accelerometer_z
        results.innerHTML = "";

        putResult("Grms_score X", signalProcessor.Grms_score(dataX))
        putResult("Grms_score Y", signalProcessor.Grms_score(dataY))
        putResult("Grms_score Z", signalProcessor.Grms_score(dataZ))

        putResult("Clearance X", signalProcessor.Clearance(dataX))
        putResult("Clearance Y", signalProcessor.Clearance(dataY))
        putResult("Clearance Z", signalProcessor.Clearance(dataZ))

        putResult("skewness X", signalProcessor.Skewness(dataX))
        putResult("skewness Y", signalProcessor.Skewness(dataY))
        putResult("skewness Z", signalProcessor.Skewness(dataZ))


        putResult("Crest X", signalProcessor.Crest(dataX))
        putResult("Crest Y", signalProcessor.Crest(dataY))
        putResult("Crest Z", signalProcessor.Crest(dataZ))

        putResult("Kurtosis X", signalProcessor.Kurtosis(dataX))
        putResult("Kurtosis Y", signalProcessor.Kurtosis(dataY))
        putResult("Kurtosis Z", signalProcessor.Kurtosis(dataZ))
    })
    function putResult(label, result) {
        results.appendChild(createElementFromHTML(`<tr><td>${label}</td><td>${result}</td></tr>`));
    }

    // Load library/vendor modules using
    // full IDs, like:
    function createElementFromHTML(htmlString) {
        console.log(htmlString)
        var tbody = document.createElement('tbody');
        tbody.innerHTML = htmlString.trim();

        // Change this to div.childNodes to support multiple top-level nodes
        console.log( tbody.firstChild)
        return tbody.firstChild;
    }

});