module TimeHandlr {
    "use strict";

    export class TimeEvent implements ITimeEvent {
        /**
         * The time at which to call this event.
         */
        time: number;

        /**
         * Something to run when this event is triggered.
         */
        callback: Function;

        /**
         * Arguments to be passed to the callback.
         */
        args: any[];

        /**
         * How many times this should repeat. If a Function, called for a return value.
         */
        repeat: number | IEventCallback;

        /**
         * How long to wait between calls, if repeat isn't 1.
         */
        timeRepeat: number | INumericCalculator;

        /**
         * How many times this has been called.
         */
        count: number = 0;

        /**
         * Initializes a new instance of the Event class.
         * 
         * @param callback   A callback to be run some number of times. If it returns 
         *                   truthy, repetition stops.
         * @param repeat   How many times to run the event.
         * @param time   The current time in the parent TimeHandlr.
         * @param timeRepeat   How long from now to run the callback, and how many
         *                     steps between each call.
         * @param args   Any additional arguments to pass to the callback.
         */
        constructor(
            callback: IEventCallback,
            repeat: number | INumericCalculator,
            time: number,
            timeRepeat: number | INumericCalculator,
            args?: any[]) {
            this.callback = callback;
            this.repeat = repeat;
            this.timeRepeat = timeRepeat;
            this.time = time + TimeEvent.runCalculator(timeRepeat, this);
            this.args = args;
        }

        /**
         * Computes a value as either a raw Number or a Function.
         * 
         * @param value   The value to be computed.
         * @param args   Any additional arguments, if value is a Function.
         * @returns A numeric equivalent of the value.
         */
        static runCalculator(value: number | INumericCalculator, ...args: any[]): number {
            if (value.constructor === Number) {
                return <number>value;
            } else {
                return (<INumericCalculator>value)(...args);
            }
        }

        /**
         * Set the next call time using timeRepeat.
         * 
         * @returns The new call time.
         */
        scheduleNextRepeat(): number {
            return this.time += TimeEvent.runCalculator(this.timeRepeat);
        }
    }
}
