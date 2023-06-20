export function initPage(body: HTMLBodyElement, width) {
    const doc: Document = body.ownerDocument;
    //console.log('----------', body, doc);
    const m: HTMLElement = doc.getElementById('main'); 
    //console.log(1, m, m.style)
    m.style.position='relative'; 
    m.style.height='100000px'; 
    m.style.width=width+'px';
    //console.log(2, m.style.width);
    let l: HTMLElement = doc.querySelector('[class^="page-layout"]'); 
    l && (l.style.width=width+'px');
    let la: HTMLElement = doc.querySelector('[class^="sport-filter-layout__filter"]'); 
    la && (la.style.display='none');
    (doc as any).clickOut = function () {
          const click = doc.createEvent('MouseEvents'); 
          const div = doc.querySelector('div');
          // @ts-ignore
          click.initEvent('click', true, true, doc.defaultView, 0, 0, 0, 0, 0, false, false, false, 0, null, null);
          div.dispatchEvent(click);
    };
    //console.log('--1');
    (doc as any).waitForElement = function(selector) {
      const s = 'div[class^="' + selector + '"]';
      return new Promise((resolve, reject) => {
          let timerId;
          let div = doc.querySelector(s);
          if (div) {
                return resolve(div);
          }
    
          const observer = new MutationObserver(mutations => {
              div = doc.querySelector(s);
              if (div) {
                  clearTimeout(timerId);
                  resolve(div);
                  observer.disconnect();
              }
          });
          observer.observe(body, {
              childList: true,
              subtree: true
          });
          timerId = setTimeout(() => {
              reject();
              observer.disconnect();
          }, 10000);
      });
    }
    //console.log('--2');
    
  }