/**
 * Lookup of current events, mapping times to all associated events.
 */
export interface ICurrentEvents {
    [i: number]: ITimeEvent[];
}

/**
 * Settings to create a class cycling event, commonly as a String[].
 */
export interface ITimeCycleSettings {
    /**
     * How many class phases should be cycled through.
     */
    length: number;

    /**
     * Each member of the Array-like cycle settings is a status checker, 
     * className, or Function to generate a className.
     */
    [i: number]: boolean | string | IClassCalculator;
}

/**
 * Information for a currently cycling time cycle.
 */
export interface ITimeCycle extends ITimeCycleSettings {
    /**
     * The container event using this cycle.
     */
    event?: ITimeEvent;

    /**
     * Where in the classes this is currently.
     */
    location?: number;

    /**
     * The previous class' index.
     */
    oldclass?: number;
}

/**
 * A container of cycle events, such as what a Thing will store.
 */
export interface ITimeCycles {
    [i: string]: ITimeCycle;
}

/**
 * General-purpose Function for events.
 * 
 * @param args   Any arguments, passed through a TimeHandlr.
 * @returns Anything truthy to stop repetition.
 */
export interface IEventCallback {
    (...args: any[]): any;
}

/**
 * General-purpose calculator for numeric values.
 * 
 * @param args   Any arguments.
 * @returns Some numeric value.
 */
export interface INumericCalculator {
    (...args: any[]): number;
}

/**
 * Calculator for event repetition.
 * 
 * @param args   Any arguments, which will be the same as the 
 *               parent event's passed args.
 * @returns Whether an event should keep repeating.
 */
export interface IRepeatCalculator {
    (...args: any[]): boolean;
}

/**
 * Calculator for a class within a class cycle.
 * 
 * @param args   Any arguments.
 * @returns Either a className or a value for whether this should stop.
 */
export interface IClassCalculator {
    (thing: IThing, settings: ITimeCycle): string | boolean;
}

/**
 * General-purpose Function to add or remove a class on a Thing.
 * 
 * @param thing   A Thing whose class is to change.
 * @param className   The class to add or remove.
 */
export interface IClassChanger {
    (thing: IThing, className: string): void;
}

/**
 * An object that may have classes added or removed, such as in a cycle.
 */
export interface IThing {
    /**
     * Whether this is capable of animating.
     */
    alive: boolean;

    /**
     * A summary of this Thing's current visual representation.
     */
    className: string;

    /**
     * Known currently operating cycles, keyed by name.
     */
    cycles: {
        [i: string]: ITimeCycle;
    };

    /**
     * A callback for when this is added.
     */
    onThingAdd: () => void;

    /**
     * Whether this is ready to have a visual display.
     */
    placed: boolean;
}

/**
 * An event to be played, including a callback, repetition settings, and arguments.
 */
export interface ITimeEvent {
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
    args?: any[];

    /**
     * How many times this should repeat. If a Function, called for whether to repeat.
     */
    repeat?: number | IRepeatCalculator;

    /**
     * How long to wait between calls, if repeat isn't 1.
     */
    timeRepeat?: number | INumericCalculator;

    /**
     * How many times this has been called.
     */
    count?: number;

    /**
     * Set the next call time using timeRepeat.
     * 
     * @returns The new call time.
     */
    scheduleNextRepeat(): number;
}

/**
 * Settings to initialize a new ITimeHandlr.
 */
export interface ITimeHandlrSettings {
    /**
     * The default time separation between events in cycles (by default, 1).
     */
    timingDefault?: number;

    /**
     * Attribute name to store listings of cycles in objects (by default, 
     * "cycles").
     */
    keyCycles?: string;

    /**
     * Atribute name to store class name in objects (by default, "className").
     */
    keyClassName?: string;

    /**
     * Key to check for a callback before a cycle starts in objects (by default,
     * "onClassCycleStart").
     */
    keyOnClassCycleStart?: string;

    /**
     * Key to check for a callback after a cycle starts in objects (by default,
     * "doClassCycleStart").
     */
    keyDoClassCycleStart?: string;

    /**
     * Optional attribute to check for whether a cycle may be given to an 
     * object (if not given, ignored).
     */
    keyCycleCheckValidity?: string;

    /**
     * Whether a copy of settings should be made in setClassCycle.
     */
    copyCycleSettings?: boolean;

    /**
     * Function to add a class to a Thing (by default, String concatenation).
     */
    classAdd?: IClassChanger;

    /**
     * Function to remove a class from a Thing (by default, String removal).
     */
    classRemove?: IClassChanger;
}

/**
 * A flexible, pausable alternative to setTimeout.
 */
export interface ITimeHandlr {
    /**
     * @returns The current time.
     */
    getTime(): number;

    /**
     * @returns The catalog of events, keyed by their time triggers.
     */
    getEvents(): ICurrentEvents;

    /**
     * Adds an event in a manner similar to setTimeout, though any arguments 
     * past the timeDelay will be passed to the event callback. The added event
     * is inserted into the events container and set to only repeat once.
     * 
     * @param callback   A callback to be run after some time.
     * @param timeDelay   How long from now to run the callback (by default, 1).
     * @param args   Any additional arguments to pass to the callback.
     * @returns An event with the given callback and time information.
     */
    addEvent(callback: IEventCallback, timeDelay?: number | INumericCalculator, ...args: any[]): ITimeEvent;

    /**
     * Adds an event in a manner similar to setInterval, though any arguments past
     * the numRepeats will be passed to the event callback. The added event is 
     * inserted into the events container and is set to repeat a numRepeat amount 
     * of times, though if the callback returns true, it will stop.
     * 
     * @param callback   A callback to be run some number of times. If it returns 
     *                   truthy, repetition stops.
     * @param timeDelay   How long from now to run the callback, and how many
     *                    steps between each call (by default, 1).
     * @param numRepeats   How many times to run the event. Infinity is an
     *                     acceptable option (by default, 1).
     * @param args   Any additional arguments to pass to the callback.
     * @returns An event with the given callback and time information.
     */
    addEventInterval(
        callback: IEventCallback,
        timeDelay?: number | INumericCalculator,
        numRepeats?: number | IEventCallback,
        ...args: any[]): ITimeEvent;

    /**
     * A wrapper around addEventInterval that delays starting the event
     * until the current time is modular with the repeat delay, so that all 
     * event intervals synched to the same period are in unison.
     * 
     * @param callback   A callback to be run some number of times. If it returns 
     *                   truthy, repetition stops.
     * @param timeDelay   How long from now to run the callback, and how many 
     *                    steps between each call (by default, 1).
     * @param numRepeats   How many times to run the event. Infinity is an
     *                     acceptable option (by default, 1).
     * @param thing   Some data container to be manipulated.
     * @param settings   Repetition settings, particularly .length.
     */
    addEventIntervalSynched(
        callback: IEventCallback,
        timeDelay: number,
        numRepeats: number | IEventCallback,
        settings: ITimeCycle): ITimeEvent;

    /**
     * Adds a sprite cycle (settings) for a thing, to be referenced by the given
     * name in the thing's keyCycles Object.
     * 
     * @param thing   The object whose class is to be cycled.
     * @param settings   A container for repetition settings, particularly .length.
     * @param name   The name of the cycle, to be referenced in the thing's cycles.
     * @param timing   A way to determine how long to wait between classes.
     */
    addClassCycle(thing: IThing, settings: ITimeCycle, name?: string, timing?: number | INumericCalculator): ITimeCycle;

    /**
     * Adds a synched sprite cycle (settings) for a thing, to be referenced by
     * the given name in the thing's keyCycles Object, and in tune with all other
     * keyCycles of the same period.
     * 
     * @param thing   The object whose class is to be cycled.
     * @param settings   A container for repetition settings, particularly .length.
     * @param name   The name of the cycle, to be referenced in the thing's cycles.
     * @param timing   A way to determine how long to wait between classes.
     */
    addClassCycleSynched(thing: IThing, settings: ITimeCycle, name?: string, timing?: number | INumericCalculator): ITimeCycle;

    /**
     * Increments time and handles all now-current events.
     */
    handleEvents(): void;

    /**
     * Handles a single event by calling its callback then checking its repeatability.
     * If it is repeatable, it is re-added at a later time to the events listing.
     *
     * @param event   An event to be handled.
     * @returns A new time the event is scheduled for (or undefined if it isn't).
     */
    handleEvent(event: ITimeEvent): number;

    /**
     * Cancels an event by making its .repeat value 0.
     * 
     * @param event   The event to cancel.
     */
    cancelEvent(event: ITimeEvent): void;

    /**
     * Cancels all events by clearing the events Object.
     */
    cancelAllEvents(): void;

    /**
     * Cancels the class cycle of a thing by finding the cycle under the thing's
     * keyCycles and making it appear to be empty.
     * 
     * @param thing   The thing whose cycle is to be cancelled.
     * @param name   The name of the cycle to be cancelled.
     */
    cancelClassCycle(thing: IThing, name: string): void;

    /**
     * Cancels all class keyCycles of a thing under the thing's sycles.
     * 
     * @param thing   The thing whose cycles are to be cancelled.
     */
    cancelAllCycles(thing: IThing): void;
}
