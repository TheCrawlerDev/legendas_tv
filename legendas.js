require('dotenv/config');
const puppeteer = require('puppeteer');

const {
  BASE_URL,
  USERNAME,
  PASSWORD,
} = process.env;

process.on('exit', (code) => {
  console.log(`About to exit with code: ${code}`);
});


(async () => {
  const browser = await puppeteer.launch({
    headless: true,
  });
  var names = ["Tony","Lisa","Michael","Ginger","Food"];
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3419.0 Safari/537.36');
  await login(page);
  await close_modal(page,'#help-box-close');
  await search(page,'Os simpsons');
  let subs = await subtitles(page,'simpsons');
  console.log("Foram encontradas "+subs.length+" legendas");
  console.log(subs);
  await browser.close();
})();

async function subtitle(page,sub){
  try{
    await page.goto(BASE_URL+sub[1]);
    var likes = parseInt( await page.evaluate( () => document.querySelector( 'body > div.container > div.middle.download > section:nth-child(2) > aside:nth-child(4) > p:nth-child(1)' ).innerText ) );
    var dislikes = parseInt( await page.evaluate( () => document.querySelector( 'body > div.container > div.middle.download > section:nth-child(2) > aside:nth-child(4) > p:nth-child(2)' ).innerText ) );
    let retorno = {
        nome: await page.evaluate( () => document.querySelector( 'body > div.container > div.middle.download > section.first > h5' ).innerText ),
        like: likes,
        dislikes: dislikes,
        like_ratio: parseFloat(likes/dislikes).toFixed(2),
        downloads: parseInt( (sub[0].split(',')[0]).replace('downloads','') ),
        nota: parseInt( (sub[0].split(',')[1]).replace('nota','') ),
        autor: ( /(por)(.*)(em)/.exec( sub[0].split(',')[2] )[2] ).trim(),
        date: new Date( (/(em)(.*)(-)/.exec( sub[0].split(',')[2] )[2]).trim() ),
        idioma: await page.evaluate( () => document.querySelector( 'body > div.container > div.middle.download > section:nth-child(2) > h1 > img' )
                .getAttribute('title') ),
        link_download: BASE_URL+
                  ( await page.evaluate( () => document.querySelector( '.icon_arrow' ).getAttribute('onclick') ) )
                  .replace("window.open('", "").replace("', '_self')", ""),
    };
    return retorno;
  }catch(err){
    console.log(err+'5\n');
  }
}

async function subtitles(page,param){
  try{
    var gallery = await page.$('#resultado_busca > div');
    var subs = await filter_subs(page,gallery,param);
    var subs_final = [];
    for await (let item of subs) {
      await subs_final.push(
        await subtitle(page,item)
      );
    }
    return subs_final;
  }catch(err){
    console.log(err+'4\n');
  }
}

async function filter_subs(page,gallery,param){
  try{
    var subs = await gallery.$$eval('.f_left', nodes => nodes.map(
        n => [
          n.querySelector('.data').innerText, // detalhes
          n.querySelector('a').getAttribute('href'), // link da legenda
        ]
      )
    );
    return subs.filter((sub_link) => {
      return ( sub_link[1].toLowerCase().includes('/download/') && sub_link[1].toLowerCase().includes(param) );
    }).sort();
  }catch(err){
    console.log(err+'3\n');
  }
}

async function search(page,param){
  try{
    await page.goto(BASE_URL+'/busca/'+param,{ waitUntil: 'networkidle0' });
  }catch(err){
    console.log(err+'2\n');
  }
  return page.url();
}

async function login(page){
  try{
    await page.goto(BASE_URL+'/login',{ waitUntil: 'networkidle0', referer: 'http://legendas.tv/' });
    await page.type('#UserUsername', USERNAME);
    await page.type('#UserPassword', PASSWORD);
    await page.type('#UserPassword', String.fromCharCode(13));
    return page.url();
  }catch(err){
    console.log(err+'1\n');
  }
}

async function verify_exists(page,selector){
  if (await page.$(selector) !== null) return true;
  else return false;
}

async function close_modal(page,selector){
  if(verify_exists(page,selector)==true) {
    await page.click(selector);
  }
}
