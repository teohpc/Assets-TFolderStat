/*

*/

function openTab(event, reportType) {
    let idx, tabContent, tabLinks;

    tabContent = document.getElementsByClassName("tabContent");
    for (idx = 0; idx < tabContent.length; idx++) {
        tabContent[idx].style.display = "none";
    };

    tabLinks = document.getElementsByClassName("tabLinks");
    for (i = 0; i < tabLinks.length; i++) {
        tabLinks[i].className = tabLinks[i].className.replace(" active", "");
    };

    document.getElementById(reportType).style.display = "block";
    event.currentTarget.className += " active";
};



async function init() {
    try {

        console.log('init');

        const MAXENTRY = 20000;
        const contextService = await AssetsClientSdk.AssetsPluginContext.get();
        const APIService = await AssetsClientSdk.AssetsApiClient.fromPluginContext(contextService);

        const context = contextService.context;
        //console.log(context);

        document.getElementById("info").style.display = "none";
        document.getElementById("stat").style.display = "block";

        let folderPath = context.activeTab.folderSelection[0].assetPath;
        let queryStr = '';
        let timeStart = performance.now();

        if (folderPath === "") {
            alert('Root Folder Stat is currently not supported');
            contextService.close();
        } else {
            queryStr = "ancestorPaths: " + "\"" + folderPath + "\"";
        };

        let message = "Folder: " + folderPath + "<br>";
        document.getElementById('reportUsage').innerHTML = message

        const requestInfo = [
            "assetDomain",
            "fileSize",
            "folderPath",
            "filename",
            "downloadCount",
            "assetPath",
            "rating",
            "viewCount"
        ];

        let result = await APIService.search({
            q: queryStr,
            metadataToReturn: requestInfo.join(','),
            num: MAXENTRY,
        });
        //console.log(result);

        if (result.hits >= 10000) {
            alert('results above a total of 10,000 will not be calculated due to technical limitations');
            contextService.close();
        };


        message += "Total object: " + result.totalHits + "<br>";
        document.getElementById('reportUsage').innerHTML = message;


        let items = result.hits;
        let reportUsage = {};
        let reportDownloadCount = [];
        let reportViewCount = [];
        let reportSize = [];

        for (let key in items) {
            reportDownloadCount.push(
                [items[key].metadata.filename,
                items[key].metadata.downloadCount,
                items[key].id
                ]);

            reportViewCount.push(
                [items[key].metadata.filename,
                items[key].metadata.viewCount,
                items[key].id
                ]);

            if (items[key].metadata.fileSize !== undefined) {
                reportSize.push(
                    [items[key].metadata.filename,
                    items[key].metadata.fileSize.value,
                    items[key].id
                    ]);
            }

            if (typeof (reportUsage[items[key].metadata.assetDomain]) != "undefined") {
                reportUsage[items[key].metadata.assetDomain]['count']++;
                if (items[key].metadata.fileSize) {
                    reportUsage[items[key].metadata.assetDomain]['size'] = reportUsage[items[key].metadata.assetDomain]['size'] + items[key].metadata.fileSize.value;
                }
            } else {
                reportUsage[items[key].metadata.assetDomain] = {};
                reportUsage[items[key].metadata.assetDomain]['count'] = 1;
                if (items[key].metadata.fileSize) {
                    reportUsage[items[key].metadata.assetDomain]['size'] = items[key].metadata.fileSize.value;
                } else {
                    reportUsage[items[key].metadata.assetDomain]['size'] = 0;
                }
            }
        };


        reportDownloadCount = (reportDownloadCount.sort((a, b) => {
            return a[1] - b[1];
        }).reverse());

        reportViewCount = (reportViewCount.sort((a, b) => {
            return a[1] - b[1];
        }).reverse());

        reportSize = (reportSize.sort((a, b) => {
            return a[1] - b[1];
        }).reverse());

        reportDownloadCount = reportDownloadCount.splice(0, 10);
        reportViewCount = reportViewCount.splice(0, 10);
        reportSize = reportSize.splice(0, 10);

        // console.log(reportUsage);
        // console.log(reportDownloadCount);
        // console.log(reportViewCount);

        let locSize = 0;
        let htmlStat = "<ul>";
        for (let key in reportUsage) {
            htmlStat += "<strong>" + key + "</strong>: ";
            htmlStat += ' ' + reportUsage[key].count + ' [ ' + (reportUsage[key].size / 1024 / 1024).toFixed(2) + ' MB ]<br>';
            locSize += reportUsage[key].size;
        };
        htmlStat += "</ul>";
        htmlStat += "Total size: " + (locSize / 1024 / 1024).toFixed(2) + ' MB<br>';


        let timeEnd = performance.now();
        let timeStat = '<p style="color:gray;font-size:10px;">Time Taken: ' + ((timeEnd - timeStart) / 1000).toFixed(2) + ' seconds.<br>';
        //locStat += 'MAXENTRY: ' + MAXENTRY;

        document.getElementById('reportUsage').innerHTML = message + htmlStat + timeStat;



        let htmlDownload = '<br><table style="width:100%">';
        for (let idx = 0; idx < reportDownloadCount.length; idx++) {
            htmlDownload += "<tr>"
            htmlDownload += "<td>" + reportDownloadCount[idx][0] + "</td>"
            htmlDownload += "<td>" + reportDownloadCount[idx][1] + "</td>"
            htmlDownload += "</tr>"
        };
        htmlDownload += "</table>";
        document.getElementById('reportDownload').innerHTML = message + htmlDownload;



        let htmlView = '<br><table style="width:100%">';
        for (let idx = 0; idx < reportViewCount.length; idx++) {
            htmlView += "<tr>"
            htmlView += "<td>" + reportViewCount[idx][0] + "</td>"
            htmlView += "<td>" + reportViewCount[idx][1] + "</td>"
            htmlView += "</tr>"
        };
        htmlView += "</table>";
        document.getElementById('reportView').innerHTML = message + htmlView;



        let htmlSzie = '<br><table style="width:100%">';
        for (let idx = 0; idx < reportSize.length; idx++) {
            htmlSzie += "<tr>"
            htmlSzie += "<td>" + reportSize[idx][0] + "</td>"
            htmlSzie += "<td>" + (reportSize[idx][1] / 1024 / 1024).toFixed(2) + " MB</td>"
            htmlSzie += "</tr>"
        };
        htmlSzie += "</table>";
        document.getElementById('reportSize').innerHTML = message + htmlSzie;

        // relation search
        //for (idx = 0; idx < reportDownloadCount.length; idx++) {


        let resultRelation = await APIService.search({
            q: 'relatedTo:A34aXeeeK5x9xugbmAXWtp',
            //metadataToReturn: requestInfo.join(','),
            num: MAXENTRY,
        });

        console.log(resultRelation);
        //}

        document.getElementById("indicator").style.display = "none";

        // All loaded, let's click
        document.getElementById("defaultOpen").click();

    } catch (err) {
        console.log('*** CATCH ***');
        console.log(err);
    }
};

