export type TFBEvent = {id: string, name: string, event: string, time: string, total: number, value: number, disabled: boolean};

export function searchEvents(
    body: HTMLBodyElement, 
    host: string, 
    selectors: string[], 
    whitelist: string[], 
    blacklist: string[], 
    paramX: string, 
    singleX: string, 
    filterToTime: number, 
    sportSection: string
): Promise<TFBEvent[]> {
    const doc: Document = body.ownerDocument;
    const root = doc.querySelector('div[class^="' + host + '"]');
    if (!root) {
      return Promise.resolve(null);
    }
    const list = root.querySelectorAll(selectors.map(s => `div[class^="${s}"]`).join(','));
    let result: TFBEvent[] = null;
    let ourSecton=false; 
    let ourCompetition=''; 
    let stop=false;  
    let promise=Promise.resolve();  
    const addResult = function(item, com: string, name: string, time: string, total: number, value: number, disable: boolean) {
        result.push({id: item.id, name: com, event: name, time: time, total: total, value: value, disabled: disable});
    };
    const checkLines = function (totalNode: Element, item: Element, com: string, name: string, time: string, total: string, value: string) {
      const disableByTime = filterToTime > 0 && time && (parseInt(time.split(':')[0]) > filterToTime) || false;
      if (total == paramX) { 
        addResult(item, com, name, time, parseFloat(total), parseFloat(value), value > singleX || disableByTime);
      } else {
        if (!disableByTime && totalNode.className.indexOf('disabled') === -1) { 
            (totalNode as HTMLElement).click();
            return (doc as any).waitForElement('sport-table-component-alternative-factors__popup__panel--').then((div) => {
                const rows = div.querySelectorAll('div[class^="sport-table-component-alternative-factors__popup__panel__row"]');
                for(let i = 0; i < rows.length; i++) {
                    let d = rows[i];
                    let t = d && d.children[0] && d.children[0].firstChild && d.children[0].firstChild.firstChild.textContent || '0.0';
                    let v = d && d.children[1] && d.children[1].firstChild && parseFloat(d.children[1].firstChild.textContent) || 0;
                    let x = parseFloat(singleX);
                    //console.log('!!!!!---',t, t == paramX, v, v <= x);
                    if (t == paramX && v <= x) {
                        addResult(item, com, name, time, t, v, false);
                        return;
                    }
                }
                throw new Error('not found');
            }).catch(() => {
                addResult(item, com, name, time, parseFloat(total), parseFloat(value), true);
            }).finally(() => (doc as any).clickOut());
        } else {
            addResult(item, com, name, time, parseFloat(total), parseFloat(value), true);
        }
    }
  };
  for(let i=0; !stop && i < list.length; i++) {
        let item: Element = list[i];
        if (item.className.startsWith('sport-section')) {
            let title = item.children[2] && item.children[2].textContent || '';
            let section = title && title === sportSection;
            stop = ourSecton && !section;
            ourSecton = section;
        }
        if (ourSecton && item.className.startsWith('sport-competition')) {
            if (result === null) {result = []} 
            ourCompetition = '';
            let title = item.children[2] && item.children[2].textContent || ''; 
            //console.log('++', title);
            if (title) { 
                //console.log('Case 1:', title, JSON.stringify(whitelist), whitelist.reduce((r, str) => r || (title.toLowerCase() === str), false));        
                if (whitelist.length > 0 && whitelist.reduce((r, str) => r || (title.toLowerCase() === str), false)){
                    ourCompetition = title; 
                    //console.log('wl-xxx', title);
                }
                //console.log('Case 2:', JSON.stringify(blacklist), blacklist.reduce((r, str) => r && (title.toLowerCase().indexOf(str) === -1), true));        
                if (whitelist.length == 0 && blacklist.reduce((r, str) => r && (title.toLowerCase().indexOf(str) === -1), true)){
                    ourCompetition = title; 
                    //console.log('bl-xxx', title);
                }
            }
        }
        if (ourSecton && ourCompetition && item.className.startsWith('sport-base-event')) {
            if (!item.id) {
                item.id=[...Array(30)].map(() => Math.random().toString(36)[2]).join('');
            }
            const cells = item.children;
            let isEvent: boolean = false, 
                com: string = ourCompetition, 
                name: string = '', 
                total: string = '', 
                value: string = '', 
                totalNode: Element = null, 
                time: string = '';
            for (let i=0; i < cells.length; i++) {
                const c = cells[i];
                if (c.className.startsWith('table-component-favorite')) {
                    isEvent = true;
                }
                if (!name && c.className.startsWith('sport-base-event__main')) {
                    name = c.firstChild && c.firstChild.firstChild && c.firstChild.firstChild.firstChild && c.firstChild.firstChild.firstChild.textContent || '-';
                    const right = c.children[1] && c.children[1].className.startsWith('sport-base-event__main__right--') && c.children[1] || null;
                    let block = null;
                    if (right) {
                        for (const child of right.children) {
                            if (child.className.startsWith('event-block-current-time--')) {
                                block = child;
                            }
                        }
                    }
                    
                  time = block && block.children[1].firstChild.textContent || '';
                }
                if (isEvent && c.className.startsWith('table-component-factor-value_param')) {
                    total = c.firstChild && c.firstChild.firstChild && c.firstChild.firstChild.textContent || '-';
                    totalNode = c;
                    const valueNode = c.nextElementSibling;
                    if (valueNode.className.indexOf('cell-state-empty--') == -1){
                        value = valueNode && valueNode.firstChild && valueNode.firstChild.textContent || '0.0';
                    } else {
                       isEvent = false;
                   }
                }
            }
            if (isEvent){
                promise = promise.then(() => checkLines(totalNode, item, com, name, time, total, value));
            }
        }
  }
  return  promise.then(()=> {
    //console.log('RRRRRRRRRRRRRRRR+', JSON.stringify(result));
    //window.myBigList = JSON.stringify(result);
    return result;
  }).catch(error => {
    // console.log('RRRRRRRRRRRRRRRR', error.message); 
    return null;
});

}