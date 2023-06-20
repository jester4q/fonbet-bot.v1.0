import {CompetitionEvent} from '../event';

export function setBet(body: HTMLBodyElement, eventId: string, eventName: string, filterTotal: string, filterValue: string): Promise<string> {
    const doc: Document = body.ownerDocument;
    const el = doc.getElementById(eventId);
    if (!el) {
        return Promise.resolve('0');
    }
    const d1 = el.querySelector('div[class^="sport-base-event__main"]');
    const name = d1 && d1.firstChild && d1.firstChild.firstChild && d1.firstChild.firstChild.firstChild && d1.firstChild.firstChild.firstChild.textContent || undefined;
    if (!name || name.localeCompare(eventName) !== 0) {
        return Promise.resolve('1');
    }
    const d2 = el.querySelector('div[class^="table-component-factor-value_param"]');
    let t = d2.firstChild && d2.firstChild.firstChild && d2.firstChild.firstChild.textContent || '-';
    const bNode = d2.nextElementSibling.nextElementSibling;
    const v = bNode && bNode.firstChild && bNode.firstChild.textContent || '0.0';
    if (t == filterTotal && Number(v) <= Number(filterValue)) {
        //console.log('row for bet ', t, v);
        if (bNode.className.indexOf('disabled') !== -1) {
            return Promise.resolve('2');
        }
        (bNode as HTMLElement).click();
        return Promise.resolve(JSON.stringify([parseFloat(t), parseFloat(v)]));
    }
    if (d2.className.indexOf('disabled') !== -1) {
        return Promise.resolve('2');
    }
    (d2 as HTMLElement).click();
    return (doc as any).waitForElement('sport-table-component-alternative-factors__popup__panel--').then((div) => {
        //console.log('POPUP: check filter Y');
        const rows = div.querySelectorAll('div[class^=\"sport-table-component-alternative-factors__popup__panel__row\"]');
        let find = '';
        for(let i = 0; !find && i < rows.length; i++) {
            let d = rows[i];
            let t = d && d.children[0] && d.children[0].firstChild && d.children[0].firstChild.firstChild.textContent || '0.0';
            let v = d && d.children[2] && d.children[2].firstChild && d.children[2].firstChild.textContent || '0.00';
            //console.log(t, t == filterTotal, v, v <= filterValue);
            if (t == filterTotal && Number(v) <= Number(filterValue)) {
                //console.log('row for bet ', i, t, v);
                d.children[1].click();
                find = JSON.stringify([parseFloat(t), parseFloat(v)]);
            }
        }
        (doc as any).clickOut(); 
        //console.log(find);
        return find || '2';
    });
}