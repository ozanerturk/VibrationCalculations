define(function (require) {
    // Load any app-specific modules
    // with a relative require call,
    // like:
    let file = document.getElementById("file");
    let loader = document.getElementById("loader");
    let results = document.getElementById("resultsBody");
    let downloadSample = document.getElementById("downloadSample");
    let resultsDom = document.getElementById("results");

    var signalProcessor = require('./signalProcessing')({ tf: tf });
    var exampleData = require('./signaldata');
    const reader = new FileReader();

    loader.style="display:none";
    resultsDom.style="display:none";

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
        loader.style="display:block";
        resultsDom.style="display:none"
    })
    reader.addEventListener('load', (event) => {
    
        const data = JSON.parse(atob(event.target.result.split("data:application/json;base64,")[1]));
        let dataX = data.data.accelerometer_x
        let dataY = data.data.accelerometer_y
        let dataZ = data.data.accelerometer_z
        let calibratedSamplingRate = parseInt(data.calibratedSamplingRate)

        putResult("Grms X", signalProcessor.Grms_score(dataX))
        putResult("Grms Y", signalProcessor.Grms_score(dataY))
        putResult("Grms Z", signalProcessor.Grms_score(dataZ))

        putResult("Vrms X", signalProcessor.Vrms_score(dataX,calibratedSamplingRate))
        putResult("Vrms Y", signalProcessor.Vrms_score(dataY,calibratedSamplingRate))
        putResult("Vrms Z", signalProcessor.Vrms_score(dataZ,calibratedSamplingRate))

        putResult("Clearance X", signalProcessor.Clearance(dataX))
        putResult("Clearance Y", signalProcessor.Clearance(dataY))
        putResult("Clearance Z", signalProcessor.Clearance(dataZ))

        putResult("skewness X", signalProcessor.Skewness(dataX))
        putResult("skewness Y", signalProcessor.Skewness(dataY))
        putResult("skewness Z", signalProcessor.Skewness(dataZ))


        putResult("Crest X", signalProcessor.Crest(dataX))
        putResult("Crest Y", signalProcessor.Crest(dataY))
        putResult("Crest Z", signalProcessor.Crest(dataZ))

        putResult("Crest_star X", signalProcessor.Crest_star(dataX,calibratedSamplingRate))
        putResult("Crest_star Y", signalProcessor.Crest_star(dataY,calibratedSamplingRate))
        putResult("Crest_star Z", signalProcessor.Crest_star(dataZ,calibratedSamplingRate))

        putResult("Kurtosis X", signalProcessor.Kurtosis(dataX))
        putResult("Kurtosis Y", signalProcessor.Kurtosis(dataY))
        putResult("Kurtosis Z", signalProcessor.Kurtosis(dataZ))
        loader.style="display:none";
        resultsDom.style="display:block";
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