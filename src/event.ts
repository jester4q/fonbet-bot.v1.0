export class CompetitionEvent {
    private _id: string = "";
    private _name: string = "";
    private _event: string = "";
    private _totalX: number = NaN;
    private _valueX: number = NaN;
    
    private _totalY: number = NaN;
    private _valueY: number = NaN;
    
    private _enabled: boolean = false;
    private _finished: boolean = false;
    
    constructor (id: string, name: string, event: string, total: number, value: number, enabled: boolean = false) {
        this._id = id;
        this._name = name;
        this._event = event;
        this._totalX = total;
        this._valueX = value;
        this._enabled = enabled;
    }

    public toString() {
        return `Competition ${this.competition()} Name ${this.event()} Total X ${this.totalXStr()} Value X ${this.valueXStr()} ID: ${this.id()}`
    }
    
    public key(): string {
        return this.competition() + ':' + this.event();
    }
    
    public id(): string {
        return this._id;
    }
    
    public setId(id: string) {
        return this._id = id;
    }
    
    public competition(): string {
        return this._name;
    }
    
    public  event(): string {
        return this._event;
    }
    
    public totalXStr(): string {
        return !this._totalX.toFixed ? 'NAN' : this._totalX.toFixed(1);
    }
    
    public totalYStr(): string {
        return !this._totalY.toFixed ? 'NAN' : this._totalY.toFixed(1);
    }
    
    public valueXStr(): string {
        return !this._valueX.toFixed ? 'NAN' : this._valueX.toFixed(2);
    }
    
    public valueYStr(): string {
        return !this._valueY.toFixed ? 'NAN' : this._valueY.toFixed(2);
    }
    
    public setX(total: number, value: number) {
        if (!this._enabled) {
            return;
        }
        this._totalX = total;
        this._valueX = value;
    }
    
    public setY(total: number, value: number) {
        if (!this._enabled || this._finished) {
            return;
        }
        this._totalY = total;
        this._valueY = value;
    }
    
    public enable(flag: boolean) {
        this._enabled = flag;
    }
    
    public finish() {
        this._finished = true;
    }
    
    public  isDisbaled(): boolean {
        return !this._enabled;
    }
    
    public isFinished(): boolean {
        return this._finished;
    }
}
