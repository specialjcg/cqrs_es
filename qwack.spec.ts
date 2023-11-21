type DomainEvent = {
    type: 'MessageQuackedFP' | 'MessageDeletedFP'
}

type MessageQuackedFP = DomainEvent & {
    content: string;
    type: 'MessageQuackedFP'
}

type MessageDeletedFP = DomainEvent & {
    type: 'MessageDeletedFP'
}



type MessageFP = {
    content: string;
    isDeleted: boolean;
}

/*
*
**/

const quack = (events: DomainEvent[]) => ( message: MessageQuackedFP):DomainEvent[] => [...events, message]

describe('test cqrs event sourcing', function () {

    it('should raise message when event is published', () => {
        const events: DomainEvent[] = quack(  [])({content:"Hello", type:"MessageQuackedFP"})

        expect(events).toStrictEqual([{content:"Hello",id:"1",type:"MessageQuackedFP"}]);
    });
/*    it('should raise message deleted when event idelete', () => {
        let _stream: IEventsStream = new MemoryEventsStream();
        _stream.Push(new MessageQuacked("Hello"));
        const message:Message=new Message(_stream);
        message.delete(_stream)
        expect(_stream.GetEvents()).toStrictEqual([new MessageQuacked("Hello"),new MessageDeleted()]);
    });
    it('should not raise message deleted when delete deleted message', () => {
        let _stream: IEventsStream = new MemoryEventsStream();
        _stream.Push(new MessageQuacked("Hello"));
        _stream.Push(new MessageDeleted());
        const message:Message=new Message(_stream);
        message.delete(_stream)
        expect(_stream.GetEvents()).toStrictEqual([new MessageQuacked("Hello"),new MessageDeleted()]);
    });
    it('should not raise message deleted when twice delete  message', () => {
        let _stream: IEventsStream = new MemoryEventsStream();
        _stream.Push(new MessageQuacked("Hello"));
        const message:Message=new Message(_stream);
        message.delete(_stream)
        message.delete(_stream)
        expect(_stream.GetEvents()).toStrictEqual([new MessageQuacked("Hello"),new MessageDeleted()]);
    });*/
});
