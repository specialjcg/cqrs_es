import {describe, it, expect} from "vitest";

type DomainEvent = {
    type: 'MessageQuackedFP' | 'MessageCouicedFP'
}

type MessageQuackedFP = {
    content: string;
    type: 'MessageQuackedFP'
}

type MessageCouicFP = {
    type: 'MessageCouicedFP'
}

type TimelineMessage = { content: string;}

const TimelineMessage = (content: string) => ({ content })

const quack = (events: DomainEvent[]) => ( message: MessageQuackedFP):DomainEvent[] => [...events, message]

const isAlreadyCouiced = (events: DomainEvent[]) => events.at(-1)?.type === 'MessageCouicedFP';

const couic = (events: DomainEvent[]) => ( message: MessageCouicFP):DomainEvent[] => isAlreadyCouiced(events) ? events : [...events, message];

const messageQuacked = (content: string): MessageQuackedFP => ({content, type: "MessageQuackedFP"});

const messageCouiced = (): MessageCouicFP => ({type: "MessageCouicedFP"})

const onlyQuackedMessages = (event: DomainEvent) => event.type === "MessageQuackedFP";

const onlyCouicedMessages = (event: DomainEvent) => event.type === "MessageCouicedFP";

const countQuacks = (events: DomainEvent[]) =>
        events.filter(onlyQuackedMessages).length - events.filter(onlyCouicedMessages).length;

const timeline = (events: DomainEvent[]): TimelineMessage[] => {
    return isAlreadyCouiced(events) ? [] : [TimelineMessage('Hello')];
}

describe('test cqrs event sourcing', function () {
    it('should raise message when event is published', () => {
        const events: DomainEvent[] = quack(  [])(messageQuacked('Hello'))

        expect(events).toStrictEqual([messageQuacked('Hello')]);
    });

    it('should raise message deleted when event is deleted', () => {
        const eventsAfterQuack: DomainEvent[] = quack([])(messageQuacked('Hello'))
        const eventsAfterCouic: DomainEvent[] = couic(eventsAfterQuack)(messageCouiced())

        expect(eventsAfterCouic).toStrictEqual([messageQuacked('Hello'), messageCouiced()]);
    });

    it('should not raise message deleted when delete deleted message', () => {
        const eventsAfterQuack: DomainEvent[] = quack([])(messageQuacked('Hello'))
        const eventsAfterCouic: DomainEvent[] = couic(eventsAfterQuack)(messageCouiced())
        const eventsAfterCouicCouic: DomainEvent[] = couic(eventsAfterCouic)(messageCouiced())

        expect(eventsAfterCouicCouic).toStrictEqual([messageQuacked("Hello"), messageCouiced()]);
    });

    it('should quack counter increment when message quacked', () => {
        const events: DomainEvent[] = quack([])(messageQuacked('Hello'))

        const count: number = countQuacks(events)

        expect(count).toBe(1);
    });

    it('should quack counter decrement  when message deleted', () => {
        const eventsAfterQuack: DomainEvent[] = quack([])(messageQuacked('Hello'))
        const eventsAfterCouic: DomainEvent[] = couic(eventsAfterQuack)(messageCouiced())

        const count: number = countQuacks(eventsAfterCouic)

        expect(count).toBe(0);
    });

    it('should timeline display message when message quacked', () => {
        const events: DomainEvent[] = quack([])(messageQuacked('Hello'))
        const timelineMessages: TimelineMessage[] = timeline(events);

        expect(timelineMessages).toStrictEqual([TimelineMessage("Hello")]);
    });

    it('should timeline display nothing  when message quacked and couiced', () => {
        const eventsAfterQuack: DomainEvent[] = quack([])(messageQuacked('Hello'))
        const eventsAfterCouic: DomainEvent[] = couic(eventsAfterQuack)(messageCouiced())
        const timelineMessages: TimelineMessage[] = timeline(eventsAfterCouic);

        expect(timelineMessages).toStrictEqual([]);
    });

    it('should timeline display something  when further message quacked and couiced', () => {
        const events1: DomainEvent[] = quack([])(messageQuacked('Hello'))
        const events2: DomainEvent[] = quack(events1)(messageQuacked('World'))
        const events3: DomainEvent[] = couic(events2)(messageCouiced())
        const eventsKenobi: DomainEvent[] = quack(events3)(messageQuacked('There'))
        const eventsGrievous: DomainEvent[] = quack(eventsKenobi)(messageQuacked('=> General Kenobi'))
        const timelineMessages: TimelineMessage[] = timeline(eventsGrievous);

        expect(timelineMessages).toStrictEqual([TimelineMessage("Hello"), TimelineMessage("There"), TimelineMessage("=> General Kenobi")]);
    });
});
