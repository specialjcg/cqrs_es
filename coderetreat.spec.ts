interface IDomainEvent {
}

interface IEventsStream {
    Push(evt: IDomainEvent): void;

    GetEvents(): IDomainEvent[];
}

class MemoryEventsStream implements IEventsStream {
    private _history: IDomainEvent[] = [];

    public Push(evt: IDomainEvent) {
        this._history.push(evt);
    }

    public GetEvents() {
        return this._history;
    }
}

class Message {
    private _projection: DecisionProjection

    Quack(publisher: IEventPublisher, content: string) {
        publisher.publish(new MessageQuacked(content));
    }

    delete(publisher: IEventPublisher) {
        if (this._projection._isDeleted) {
            return;
        }
        this.pushAndApply(publisher, new MessageDeleted());
    }

    private pushAndApply(publisher: IEventPublisher, evt: MessageDeleted) {
        publisher.publish(evt);
        this._projection.apply(evt);
    }

    constructor(history: IEventsStream) {
        this._projection = new DecisionProjection(history);
        for (const item of history.GetEvents()) {
            if (item instanceof MessageDeleted) {
                this._projection.apply(item);
            }
        }
    }


}

class DecisionProjection {
    _isDeleted: boolean = false;

    constructor(history: IEventsStream) {
        for (const item of history.GetEvents()) {
            if (item instanceof MessageDeleted) {
                this.apply(item);
            }
        }
    }

    apply(evt: MessageDeleted) {
        this._isDeleted = true;
    }

}

class MessageQuacked implements IDomainEvent {

    private _content: string;

    constructor(content: string) {
        this._content = content;
    }

    content(): string {
        return this._content;
    }
}

class MessageDeleted implements IDomainEvent {
    constructor() {
    }
}

class QuackCounter {
    private _count: number = 0;

    Handle(message: MessageQuacked): void;
    Handle(message: MessageDeleted): void;

    Handle(message: MessageQuacked | MessageDeleted): void {
        if (message instanceof MessageQuacked) {
            ++this._count;
        } else if (message instanceof MessageDeleted) {
            --this._count;
        }
    }

    getCount(): number {
        return this._count;
    }
}

class TimelineMessage {

    private _content: string;

    constructor(content: string) {
        this._content = content;
    }
    content(): string {
        return this._content;
    }
}

interface IEventSubscriber<IDomainEvent> {
    message: IDomainEvent;
    Handle(evt: IDomainEvent): void
}


class EventSubscriber<T> implements IEventSubscriber<T> {
    called: boolean;



    constructor(initialValue: T) {
        this.message = initialValue;
        this.called = false
    }


    message: T;

    Handle(evt: T): void {
this.called=true
        this.message = evt
    }
}


class Timeline implements IEventSubscriber<MessageQuacked> {
    getmessage(): TimelineMessage[] {
        return this._message;
    }

    private _message: TimelineMessage[] = [];

    Handle(messageIdomain: MessageQuacked) {
        this._message.push(new TimelineMessage(messageIdomain.content()));
    }

    message: MessageQuacked;
}

interface IEventPublisher {
    publish<IDomainEvent>(evt: IDomainEvent): void;
}


class EventBus implements IEventPublisher {
    private stream: IEventsStream;
    private _subscribers: IEventSubscriber<IDomainEvent>[] = [];

    constructor(_stream: IEventsStream) {
        this.stream = _stream

    }

    publish<T>(evt: T) {
        this.stream.Push(evt);
        for (const sub of this._subscribers) {
            if (sub.message instanceof MessageQuacked) sub.Handle(evt);

        }


    }


    subscribe(subscriber: IEventSubscriber<IDomainEvent>) {
        this._subscribers.push(subscriber);

    }
}

describe('test cqrs event sourcing', function () {
    let _stream: IEventsStream;
    let _eventBus: EventBus;
beforeEach(()=>{

    _stream = new MemoryEventsStream();

    _eventBus = new EventBus(_stream);
})
    it('should raise message when event is published', () => {

        const message: Message = new Message(_stream);
        message.Quack(_eventBus, "Hello");
        expect(_stream.GetEvents()).toStrictEqual([new MessageQuacked("Hello")]);
    });
    it('should raise message deleted when event idelete', () => {
        _stream.Push(new MessageQuacked("Hello"));
        const message: Message = new Message(_stream);
        message.delete(_eventBus)
        expect(_stream.GetEvents()).toStrictEqual([new MessageQuacked("Hello"), new MessageDeleted()]);
    });
    it('should not raise message deleted when delete deleted message', () => {
        _stream.Push(new MessageQuacked("Hello"));
        _stream.Push(new MessageDeleted());
        const message: Message = new Message(_stream);
        message.delete(_eventBus)
        expect(_stream.GetEvents()).toStrictEqual([new MessageQuacked("Hello"), new MessageDeleted()]);
    });
    it('should not raise message deleted when twice delete  message', () => {
        _stream.Push(new MessageQuacked("Hello"));
        const message: Message = new Message(_stream);
        message.delete(_eventBus)
        message.delete(_eventBus)
        expect(_stream.GetEvents()).toStrictEqual([new MessageQuacked("Hello"), new MessageDeleted()]);
    });
    it('should quack counter increment  when message quacked', () => {
        let quackCounter = new QuackCounter();
        quackCounter.Handle(new MessageQuacked("Hello"));
        expect(quackCounter.getCount()).toBe(1);
    });
    it('should quack counter decrement  when message deleted', () => {
        let quackCounter = new QuackCounter();
        quackCounter.Handle(new MessageQuacked("Hello"));
        quackCounter.Handle(new MessageDeleted());

        expect(quackCounter.getCount()).toBe(0);
    });
    it('should timeline display message  whene message quacked', () => {
        let timeline = new Timeline();
        timeline.Handle(new MessageQuacked("Hello"));
        expect(timeline.getmessage()).toStrictEqual([new TimelineMessage("Hello")]);
    });
    //todo implement deleted message by id



    it('should store event whenpublish event', () => {
        let eventBus = new EventBus(_stream);
        eventBus.publish(new MessageQuacked("Hello"));
        expect(_stream.GetEvents()).toStrictEqual([new MessageQuacked("Hello")]);

    });
    it('should call each handler when publish event', () => {
        let eventBus = new EventBus(new MemoryEventsStream());
        const subscribe1 = new EventSubscriber<MessageQuacked>(new MessageQuacked("Hello"));
        eventBus.subscribe(subscribe1);
        const subscribe2 = new EventSubscriber<MessageQuacked>(new MessageQuacked("Hello"));

        eventBus.subscribe(subscribe2)
        const subscribe3 = new EventSubscriber<MessageDeleted>(new MessageDeleted());

        eventBus.subscribe(subscribe3)


        eventBus.publish(new MessageQuacked("Hello"));

        expect(subscribe1.called).toBe(true);
        expect(subscribe2.called).toBe(true);
        expect(subscribe3.called).toBe(false);

    });
    it('should mixed display message in timeline when quack message ', () => {
        let timeline = new Timeline();
        _eventBus.subscribe(timeline)
        const message: Message = new Message(_stream);
        message.Quack(_eventBus, "Hello");
        expect(timeline.getmessage()).toStrictEqual([new TimelineMessage("Hello")])

    });
});
