import { ElementHandle } from 'puppeteer';
import { Config } from './config';
import { CompetitionEvent } from './event';
import { BotBrowser } from './browser';
import { Log } from './logger';
import { TFBEvent, searchEvents } from './scripts/search-events';
import { initPage } from './scripts/init-page';
import { setBet } from './scripts/set-bet';


const BROWSER_WIDTH: number = 1600;
const BROWSER_HEIGHT: number = 800;
const URL: string = "https://www.fon.bet/";
const LOGIN_BTN_SELECTOR: string = "a._login-btn";
const LOGIN_FORM_SELECTOR_1: string = "login-form__form";
const LOGIN_FORM_SELECTOR_2: string = "authorization__form--";
const ACCOUNT_BTN_SELECTOR: string = "a._type_account";
const TABLE_SELECTOR: string = "sport-section-virtual-list";
const SPORT_SESECTION: string = "Футбол";

export class Bot {

  private readonly targets: Map<string, CompetitionEvent>;
  private readonly browser: BotBrowser;

  constructor(private config: Config) {
    this.targets = new Map();
    this.browser = new BotBrowser(this.config);
  }


  async run() {

    let ok = await this.open()
    
    if (ok) {
        await this.pause();
        ok = await this.login();
    }
    if (ok) {
        ok = await this.live(false);
    }
    for (let i = 0; ok; i++) {
        Log.out(`----------------------- RATE ${i}`);
        if(!await this.readTable()) {
            ok = await this.live(true);
            continue;
        }
        const keysForDelete: Set<string> = new Set();
        for(const entry of this.targets.values()){
            try {
                if (await this.trySetBet(entry)) {
                    entry.finish();
                }
            } catch (error) {
                keysForDelete.add(entry.key());
            }
        }
        for(const key of keysForDelete) {
            if (key != null) {
                const e = this.targets.get(key);
                
                Log.out(
                    `Deleted Event -> ${e.toString()}`,
                );
                this.targets.delete(key);
            }
        }
    }
    await this.stop();
    Log.out("Bot is stopped");
   
  }

  private stop() {
    return new Promise(r => setTimeout( () => this.browser.stop().then(r), this.config.pause() * 1000));
  }

  private pause() {
    // dummy
    return new Promise(r => setTimeout(r, this.config.pause() * 1000));
  }

  private async open() {
    try {
      await this.browser.open(URL, LOGIN_BTN_SELECTOR, BROWSER_WIDTH, BROWSER_HEIGHT);
      Log.out("Bot is started");
      return true;
    } catch (error) {
      Log.err(error.message);
      Log.err("Failed to start bot");
      //this.driver = null;
    }

  
    return false;
  }

  private async login(): Promise<boolean> {
    try {
      const button:ElementHandle<Element> = await this.browser.findElement(LOGIN_BTN_SELECTOR);
      if (!button) {
        Log.err("Failed to get login button");
        return false;
      }
      await button.click();

      const formSelector: string[] = [LOGIN_FORM_SELECTOR_1, LOGIN_FORM_SELECTOR_2];
      this.browser.waitElementByClass(formSelector);
      const forms:ElementHandle<Element>[] = await this.browser.findElementByClass(formSelector);
      if (!forms.length) {
        Log.err("Failed to get login form");
        return false;
      }
      const form = forms[0];
      const inputs:ElementHandle<Element>[] = await form.$$("input");
      if (inputs.length != 2) {
        Log.err("Failed to get login inputs");
        return false;
      }
      await this.browser.type(inputs[0], this.config.username());
      await this.browser.type(inputs[1], this.config.password());
      const submit:ElementHandle<Element> = await form.$("button");
      await submit.click();
      await this.browser.waitElement(ACCOUNT_BTN_SELECTOR);
      Log.out(`Logged in as ${this.config.username()}`);
      return true;
      
    } catch (error) {
      //console.log(error);
        Log.err(error.mesage);
        Log.err("Failed to login");
    }
    return false;
  }

  private async live(reload: boolean): Promise<boolean> {
    try {
      //if (reload) {
      //    await this.browser.navigate(URL + "live/");
      //} else {
          await this.browser.navigate(URL + "live/");
      //}
      await this.browser.waitElementByClass("sport-area__grow");
      await this.browser.executeScript (initPage, BROWSER_WIDTH);  
        
              
        Log.out("Live table is oppened");
        return true;
    } catch (error) {
        Log.err(error.mesage);
        Log.err("Failed to open live table");
    }
  
    return false;
  }

  private async searchEvents(): Promise<CompetitionEvent[]> {
    const whitelist: string[] = this.config.whitelist().map(str => str.toLowerCase()).filter((str) => !!str);
    const blacklist: string[] = this.config.blacklist().map(str => str.toLowerCase()).filter((str) => !!str);
    const filterX: number[] = this.config.filterX();
    try {
        const events: TFBEvent[] = await this.browser.executeScript(
            searchEvents, 
            TABLE_SELECTOR, 
            ["sport-section--", "sport-competition--", "sport-base-event--"], 
            whitelist, 
            blacklist, 
            filterX[0].toFixed(1), 
            filterX[1].toFixed(2), 
            this.config.filterToTime(), 
            SPORT_SESECTION
        );

            //console.log(events);
        Log.out("TABLE: " + JSON.stringify(events));
        if (!events || !Array.isArray(events)) {
            return null;
        }
        return events.map(item => new CompetitionEvent(item.id, item.name, item.event, item.total, item.value, !item.disabled));
        
    } catch (e) {
        Log.err(e.message);
        Log.err("Some problem with events search js");
        return null;
    }
    
}

  private async readTable(): Promise<boolean> {
    const events = await this.searchEvents();
    if (events == null) {
        Log.out("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ WE GET EMPTY TABLE @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
        return false;
    }
    const keys = [];
    for(let e of events) {
        keys.push(e.key());
        const old: CompetitionEvent = this.targets.has(e.key()) ?  this.targets.get(e.key()) : (this.targets.set(e.key(), e) && null);
        if (old != null && !old.isFinished()) {
            old.setId(e.id());
            if (old.isDisbaled() && !e.isDisbaled()) {
                old.enable(true);
                Log.out(
                    `Added Event -> ${e.toString()}`
                );
            }
        }
        if (old == null && !e.isDisbaled()) {
            Log.out(
                `Added Event -> ${e.toString()}`
            );
        }

    }
    const forDelete = [...this.targets.values()].filter(val => !keys.includes(val.key()));
    forDelete.forEach(val => {
        Log.out(`Deleted Event (no in the table) -> ${val.toString()}`);
        this.targets.delete(val.key());
    })
    
    return true;
  }

  private async clearBetPanel(): Promise<void> {
    try {
        await this.browser.executeScript((body: HTMLBodyElement) => {
          const doc: Document = body.ownerDocument;
          const div: HTMLElement = doc.querySelector('div[class^="stakes-head__clear--"]');
          return div && div.click();
        });
    } catch (error) {
        Log.err(error.mesage);
    }
  }

  private async closeModal() {
    try {
        const button = await this.browser.findElement("div.modal-window__close");
        if (button) {
            await button.click();
        }
    } catch (error) {
        //System.out.println("Error:" + error.getLocalizedMessage());
    }
}

  private async trySetBet(e: CompetitionEvent): Promise<boolean> {
    if (e.isDisbaled() || e.isFinished()) {
        return false;
    }
    Log.out(`Check bet line for Competition ${e.competition()} Name ${e.event()}`);
    try {
        await this.clearBetPanel();
        Log.out(`Clear bet panel`);
        if (!(await this.tryGetBetLine(e))) {
            return false;
        }
        Log.out(`Found line for bet`);
        await this.browser.waitElementByClass("new-coupon");
        const panel = await this.browser.findElementByClass(["new-coupon"]);
        if (!panel.length) {
            throw new Error("Bet panel is not find");
        }
        Log.out(`Found bet panel`);
        //const input: ElementHandle<HTMLInputElement>[] = (await this.browser.findElementByClass(["sum-panel__input--"])) as ElementHandle<HTMLInputElement>[];
        const panelClassName = (await this.browser.getClassName(panel[0])).split(' ')[0];
        const input: ElementHandle<HTMLInputElement> = (await this.browser.findElement(`div.${panelClassName} input`)) as ElementHandle<HTMLInputElement>;
        
        if (!input) {
            throw new Error("Input for bet value is not find");
        }

        Log.out(`Found input`);
        await this.browser.setTextToInput(input, this.config.bet().toFixed(2));
        Log.out(`Set text to input`);

        //const container  = await this.browser.getChild(panel[0], 2);
        //Log.out(`Container ${container && container.toString() || 'null'} ${container && (await this.browser.getClassName(container)) || '---'}`);
        //const buttonPanel  = await this.browser.getChild(container, 7);
        //Log.out(`Button panel ${buttonPanel && buttonPanel.toString() || 'null'} ${buttonPanel && (await this.browser.getClassName(buttonPanel)) || '---'}`);
        const button = await this.browser.findElementByClass(["button--"], panel[0]);

        if (!button.length) {
            throw new Error('Could not find button fot set bet');
        }
        Log.out(`Found button`);
        const buttonClassName = await this.browser.getClassName(button[0]);
        Log.out('Bet button class ' + buttonClassName);
        if (!button.length || buttonClassName.indexOf("_disabled") !== -1) {
            throw new Error("Button fot set bet is disabled");
        }
        await button[0].click();
        Log.out(`+++ Success to set bet for Competition ${e.competition()} Name ${e.event()} Total Y ${e.totalYStr()} Value Y ${e.valueYStr()} +++`);
        await this.closeModal();
        Log.out(`Close modal window`);
        return true;
    } catch ( error) {
        if (error instanceof IncorrectEventException) {
          throw error;
        } else {
          Log.err(error.message);
          Log.err("Failed to set bet");
        }
    }
    
    return false;
    
}

  private async tryGetBetLine(e: CompetitionEvent): Promise<boolean> {
    const filterY: number[] = this.config.filterY();
    try {
        const result: string = await this.browser.executeScript(setBet, e.id(), e.event(), filterY[0].toFixed(1), filterY[1].toFixed(2));
        if (!result || result == '0' || result == '1') {
            throw new IncorrectEventException(`Row is not found by id ${e.id()} [reson ${result}]`);
        }
        const betLineJson = result;
        if (betLineJson.indexOf("[") === 0) {
            try {
                const jsonArray = JSON.parse(betLineJson);
                const t: number = jsonArray[0];
                const v: number = jsonArray[1];
                if (t > 0 && v > 0) {
                    e.setY( t, v);
                }
                return true;
            } catch (err) {
                Log.err(err.message);
                Log.err(`Some problem with json parse of bet line ${betLineJson}`);
            }
        }

    } catch (error) {
        Log.err(error.toString());
        Log.err("Some problem with bet line search js");
        return false;
    }
    return false;
  }
}

class IncorrectEventException extends Error {

}