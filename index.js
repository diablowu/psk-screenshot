const puppeteer = require('puppeteer');
const moment = require('moment');
const path = require('path');
const { ArgumentParser } = require("argparse");



const bandFreqMap = {
    '6m': '45000000-55000000',
    '2m': '75000000-160000000'
}


function initFlags(){
    const parser = new ArgumentParser({ description: "PSK Screenshot" });
    parser.add_argument("-o", {
        dest: "outputDir",
        type: "str",
        help: "image out dir",
        required: true,
      });
      parser.add_argument("--band","-b", {
        dest: "band",
        type: "str",
        help: "Band",
        choices: ["6m", "2m"],
        required: true,
      })
      parser.add_argument("--zoom", {
          dest: "zoom",
          type: "float",
          help: "Zoom level",
          default: 4.5
      });

      return parser.parse_args();
      
}




const buildPSKUrl = (band,zoom) => { 

    if(!bandFreqMap[band]) { 
        throw new Error(`band ${band} not supported`)
    }

    if(!zoom) {
        zoom = 4.5
    }

    return 'https://pskreporter.info/pskmap.html?'+
    'preset&callsign=ZZZZZ&what=all&band='+bandFreqMap[band]+
    '&timerange=900&distunit=km&'+
    'hideunrec=1&blankifnone=1&hidepink=1&hidenight=0&hidelight=1&showsnr=1&showlines=1&'+
    'azcenter=OM89FV&'+
    'mapCenter=36.337101472321876,113.40354444857537,'+zoom;
}





const screenshot = async (band,zoom, imgDirPath) => {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: [ '--proxy-server=socks5://127.0.0.1:10808' ]
    });
    const page = await browser.newPage();
    let u = buildPSKUrl(band,zoom);
    console.log(`url: ${u}`)
    await page.goto(u);
    await page.setViewport({
        width: 1280,
        height: 1024
    });

        
    await new Promise(r => setTimeout(r, 10000));

    await page.waitForNetworkIdle({idleTimeout: 10000, threshold: 5000})
    
    await page.addStyleTag({content: '#contents1{display: none}'})

    let ts = moment().utc().format("YYYY-MM-DD-HH-mm-ss")

    await page.screenshot({
        path: path.join(imgDirPath,`${ts}.png`),
        fullPage: true
    });

    await browser.close();
};




async function main() {
    const args = initFlags();
    console.log(args)
    screenshot(args.band,args.zoom, args.outputDir)
};



main();