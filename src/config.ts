
import { readFileSync } from 'node:fs'
import { getProperties } from 'properties-file'

const PATH = 'config/general.config.txt';

class LocalProperties {
    public pathToChrome: string;
    public username: string;
    public password: string;
    public pause: number;
    public blacklist: string[];
    public whitelist: string[];
    public filterX: number[];
    public filterY: number[];
    public bet: number;
    public filterToTime: number;
}


export class Config  {
    
    private properties: {[key: string]: any};
    private data: LocalProperties;
    private timer: NodeJS.Timeout;
    
    
    constructor() {
        this.data = new LocalProperties();
        this.load();
        this.timeout();
    }
    
    
    protected load(): boolean {
        try {
            //console.log(`Load properties by path ${PATH}`);
            const file = readFileSync(PATH)
            this.properties = getProperties(file);
            this.data = new LocalProperties();
            //console.log('Read properties', this.properties);
            return true;
        } catch (error) {
            console.error(error);
        }
        return false;
    }
    
    public username(): string {
        if (this.data.username === undefined) {
            this.data.username = this.properties['login.username'];
        }
        return this.data.username;
    }
    
    public password(): string {
        if (this.data.password === undefined) {
            this.data.password = this.properties['login.password'];
        }
        return this.data.password;
    }
    
    public pause(): number {
        if (this.data.pause == undefined) {
            const value = this.properties['browser.pause'];
            this.data.pause =  parseInt(value);
            if (isNaN(this.data.pause)) {
                this.data.pause = 30;
            }    
        }    
        return this.data.pause;
    }

    public pathToChrome(): string {
        if (this.data.pathToChrome == undefined) {
            const value: string = this.properties['browser.path'];
            console.log(value);
            this.data.pathToChrome =  value.replace(/\//gi, '\\');
            console.log(this.data.pathToChrome);
        }    
        return this.data.pathToChrome;
    }
    
    public blacklist(): string[] {
        if (this.data.blacklist === undefined) {
            const value = this.properties["competition.blacklist"];
            if (value) {
                const list = value.split(";");
                this.data.blacklist = list; 
            } else {
                this.data.blacklist = [];
            }
        }
        return this.data.blacklist;
    }
    
    public whitelist(): string[] {
        if (this.data.whitelist === undefined) {
            const value = this.properties['competition.whitelist'];
            if (value) {
                const list = value.split(";");
                this.data.whitelist = list; 
            } else {
                this.data.whitelist = [];
            }
        }
        return this.data.whitelist;
    }
    
    
    
    public filterX(): number[] {
        if (this.data.filterX === undefined) {
            const total = this.properties['competition.filterTotalX'];
            const value = this.properties['competition.filterValueX'];
            const v1 =  parseFloat(total);
            const v2 =  parseFloat(value);
            if (!isNaN(v1) && !isNaN(v2)) {
                this.data.filterX = [v1, v2];
            } else {
                this.data.filterX = [0, 0];
            }
        }
        return this.data.filterX;
    }
    
    
    public filterY(): number[] {
        if (this.data.filterY === undefined) {
            const total = this.properties["competition.filterTotalY"];
            const value = this.properties["competition.filterValueY"];
            const v1 =  parseFloat(total);
            const v2 =  parseFloat(value);
            if (!isNaN(v1) && !isNaN(v2)) {
                this.data.filterY = [v1, v2];
            } else {
                this.data.filterX = [0, 0];
            }
                
        }
        return this.data.filterY;
    }
    
    public filterToTime(): number {
        if (this.data.filterToTime === undefined) {
            const value = this.properties["competition.filterToTime"];
            this.data.filterToTime = parseInt(value);
            if (isNaN(this.data.filterToTime)) {
                this.data.filterToTime = 0;
            }
        }
        return this.data.filterToTime;
    }
    
    public bet(): number {
        if (this.data.bet === undefined) {
            const value = this.properties["bet.value"];
            const v =  parseFloat(value);
            this.data.bet = 0;
            if (!isNaN(v)) {
                this.data.bet = v;
            }
            
        }
        return this.data.bet;
    }
    
    private timeout() {
        this.timer = setInterval(() => {
            this.load();
        }, 30 * 60 * 1000);
    }
    
}
