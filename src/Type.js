/*!
 * @author       Rogier Geertzema
 * @copyright    2016 Rogier Geertzema
 * @license      {@link https://github.com/unnoon/cell-type/blob/master/LICENSE|MIT License}
 * @overview     Prototypal(OLOO) inheritance algorithm.
 */
/*? if(MODULE_TYPE !== 'es6') {*/
!function(root, type) {
/* istanbul ignore next */ switch(true) {
/*amd*/    case typeof(define) === 'function' && root.define === define && !!define.amd : define(type);                                                              break;
/*node*/   case typeof(module) === 'object'   && root === module.exports                : module.exports = type();                                                   break;
/*global*/ case !root.Type                                                              : Reflect.defineProperty(root, 'Type', {value: type(), enumerable: !0}); break; default : console.error("'Type' is already defined on root object")}
}(this, function type() { "use strict";
/*es6*//*? } else { write('export default Type\n\n') } *//*<3*/

const ATTRS = ['state', 'static', 'alias', 'override', 'enumerable', 'configurable', 'writable', 'const', 'readonly', 'frozen', 'sealed', 'extensible', 'attached', 'solid', 'validate'];
const RGX   = {
    upper:             /\bthis\.upper\b/,
    illegalPrivateUse: /\b(?!this)[^A-Z\s=][\w\$]+\._[^_\.][\w\$]+\b/g
};

// symbols
const $type     = Symbol.for('cell-type');       // symbol for type data stored on the proto
const $attrs    = Symbol.for('cell-type.attrs');
const $defaults = Symbol.for('cell-type.defaults');
const $owner    = Symbol.for('cell-type.owner'); // symbol to store the owner of a method so we can get the proper dynamic super.
const $inner    = Symbol.for('cell-type.inner'); // reference to the wrapped inner function
const $dsc      = Symbol.for('cell-type.dsc');   // symbol to tag an object as a cell-type descriptor

const Prototype = {
    /**
     * @readonly
     * @name Type.$info
     * @desc
     *       Info object to hold general module information.
     *
     * @type Object
     */
    $info: {[$attrs]: 'static frozen solid', value: {
        "name"       : "cell-type",
        "description": "Prototypal(OLOO) inheritance algorithm.",
        "version"    : "/*?= VERSION */",
        "url"        : "https://github.com/unnoon/cell-type"
    }},
    /**
     * @method Type#init
     * @desc
     *         Initializes the type.
     *
     * @param  {Object} data - The data for the type.
     *
     * @return {Object} The constructed prototype.
     */
    init(data)
    {   this._proto = null;
        // optional not necessarily unique name for debugging purposes
        this.name   = data.name || '';
        this.model  = {}; // Where the key is the name|symbol and the value an extended descriptor including additional attributes.
        // this.static  = {
        //     upper: null
        // };
        this.add(data);

        return this.proto
    },
    add(data)
    {
        var links, compose, statics, props, state;

        if(links   = (data.links   || data.inherits))           {this.links(links)}
        if(compose = (data.compose || data.mixin || data.with)) {this.compose(...compose)}
        if(statics = (data.statics))                            {this.statics(statics)}
        if(props   = (data.properties))                         {this.properties(props)}
        if(state   = (data.state))                              {this.state(state)}
    },
    /**
     * @name Type.$attrs
     * @desc
     *       Array holding all possible attributes.
     *
     * @type Array
     */
    $attrs: {[$attrs]: 'static', value: ATTRS},
    /**
     * @private
     * @method Type._$assignAttrsToDsc
     *
     * @param {Array<string>} attributes - Array containing the attributes.
     * @param {string}        prop       - The property name to process naming conventions into descriptor settings.
     * @param {Object}        dsc        - The descriptor to be extended with the attributes.
     * @param {Object}        options    - Object containing additional options.
     */
    _$assignAttrsToDsc(attributes, prop, dsc, options)
    {   "<$attrs static>";
        // helper props
        dsc.method   = dsc.hasOwnProperty('value') && (dsc.value instanceof Function);
        dsc.accessor = !!(dsc.get || dsc.set);
        dsc.property = !dsc.method && !dsc.accessor;
        // allow automatic statification based on $ or _$ prefix
        if(typeof(prop) === 'string' && /^_?\$/.test(prop)) {dsc.static = true}

        // TODO needs cleanup
        // global options
        Object.assign(dsc, options);

        // defaults
        dsc.validate = true;
        dsc[$dsc]    = true;

        // property specific options
        for(let attr of attributes)
        {   let value;
            switch(true)
            {
                case(  !attr.indexOf('!')) : value = false;                  attr = attr.slice(1); break;
                case(!!~attr.indexOf('=')) : value = attr.match(/[\$\w]+/g); attr = value.shift(); break;
                default                    : value = true;
            }
            if(!~ATTRS.indexOf(attr)) {console.warn(`'${attr}' is an unknown attribute and will not be processed.`)}

            dsc[attr] = value;
        }

        if(dsc.property && !dsc.static)            {dsc.state        = true}
        if(dsc.solid || dsc.readonly || dsc.const) {dsc.writable     = false}
        if(dsc.solid || dsc.attached)              {dsc.configurable = false}

        dsc.enumerable = dsc.static ? true :
                         dsc.method ? false :
                                      dsc.enumerable;
    },
    crawlState()
    {
        const state = crawlStateFromModel({}, this.model);
        let   proto = this.proto;

        while((proto = Object.getPrototypeOf(proto)) && proto[$type]) {crawlStateFromModel(state, proto[$type].model)}

        function crawlStateFromModel(state, model)
        {
            const keys = [...Object.getOwnPropertySymbols(model), ...Object.keys(model)];

            keys.forEach(prop => {
                if(model[prop].state) {state[prop] = model[prop]}
            });

            return state
        }

        return state
    },
    /**
     * @private
     * @method Type._$decorate
     * @desc
     *         Decorates an object as a Type prototype output object.
     *
     * @param {Object} proto - The object to be decorated.
     * @param {Type}   type  - Reference to the type object that will be stored under Symbol(cell-type).
     *
     * @returns {Object} The decorated prototype object.
     */
    _$decorate(proto, type) {
    "<$attrs static>";
    {
        return Object.defineProperties(proto, {
            [$type]:     {value: type}, // store the Type model
            [$defaults]: {get: () => type.crawlState()}, // dynamically get the state. TODO option to make this static
            // upper:       {get: () => proto[$type].static.upper, set: (v) => proto[$type].static.upper = v, enumerable: true} // TODO check if a accessor is really necessary
            upper:       {value: null, enumerable: true, writable: true}
        });
    }},
    /**
     * @private
     * @method Type._$enhanceProperty
     * @desc
     *         Enhances a property in case of upper, statics, extensibility, sealing and freezing
     *
     * @param {Object}        obj  - The owner of the property that needs to be enhanced.
     * @param {string|Symbol} prop - The property that needs enhancement.
     * @param {Object}        dsc  - The property descriptor.
     */
    _$enhanceProperty(obj, prop, dsc)
    {   "<$attrs static>";
        ['value', 'get', 'set'].forEach(method => {
            if(!dsc.hasOwnProperty(method)) {return} // continue

            if(RGX.upper.test(dsc[method]))  {Prototype._$upperEnhanceProperty(obj, prop, dsc, method)}
            if(dsc.extensible === false)     {Object.preventExtensions(dsc[method])}
            if(dsc.sealed)                   {Object.seal(dsc[method])}
            if(dsc.frozen)                   {Object.freeze(dsc[method])}
        });
    },
    /**
     * @private
     * @method Type._$extend
     * @desc
     *         Extend function supporting validations/symbols/attributes etc.
     *
     * @param {Object}  obj        - object to extend.
     * @param {Object}  properties - object with the extend properties.
     * @param {Object=} options    - options object
     *
     * @returns {Object} the object after extension.
     */
    _$extend(obj, properties, options={})
    {   "<$attrs static>";

        const keys = [...Object.getOwnPropertySymbols(properties), ...Object.keys(properties)];

        keys.forEach(prop => {
            obj[$type].model[prop] = Prototype._$processDescAttrs(prop, Object.getOwnPropertyDescriptor(properties, prop), options);
        });

        keys.forEach(prop => {
            let dsc   = obj[$type].model[prop];
            let names = dsc.alias || []; names.unshift(prop);

            Prototype._$validate(obj, prop, dsc, obj[$type].model);
            Prototype._$enhanceProperty(obj, prop, dsc);

            names.forEach(name => {
                if(dsc.state) {return} // continue
                Object.defineProperty(obj, name, dsc);
                if(dsc.static && obj.hasOwnProperty('constructor')) {Object.defineProperty(obj.constructor, name, dsc)}
            });
        });

        return obj
    },
    /**
     * @method Type.$getPropertyDescriptor
     * @desc
     *         Gets the descriptor of a property in a prototype chain.
     *
     * @param {Object} obj  - the object in the prototype chain.
     * @param {string} prop - the name of the property.
     *
     * @returns {Object|undefined} - the property descriptor or undefined in case no descriptor is found.
     */
    $getPropertyDescriptor(obj, prop)
    {   "<$attrs static>";
        if(obj.hasOwnProperty(prop)) {return Object.getOwnPropertyDescriptor(obj, prop)}

        while(obj = Object.getPrototypeOf(obj)) {if(obj.hasOwnProperty(prop)) {return Object.getOwnPropertyDescriptor(obj, prop)}}
    },
    /**
     * @method Type.$getPrototypesOf
     * @desc
     *         Returns the whole prototype chain of an object in an array.
     *
     * @param {Object} obj - Object to get the prototype chain of.
     *
     * @returns {Array} Array containing the prototype chain
     */
    $getPrototypesOf(obj)
    {   "<$attrs static>";
        let proto = obj, protos = [];

        while(proto = Object.getPrototypeOf(proto)) {protos.push(proto)}

        return protos
    },
    implements()
    {
        // TODO
    },
    /**
     * @method Type#links
     * @desc   **aliases:** inherits
     * #
     *         links/inherits another object(prototype).
     *         In case no arguments are given, it will return the linked prototype.
     *
     * @param {Object=} proto - The object(prototype) to be linked.
     *
     * @returns {Type|Object} this|linked prototype in case no arguments are given.
     */
    links(proto=undefined) {
    "<$attrs alias=inherits>";
    {   if(proto === undefined) {return Reflect.getPrototypeOf(this.proto)}

        this.proto = !this._proto
            ? Prototype._$decorate(Object.create(proto), this)
            : Reflect.setPrototypeOf(this.proto, proto); // try to avoid this as it is slow.

        return this
    }},
    /**
     * @private
     * @method Type._$processDescAttrs
     * @desc
     *       processes any attributes passed to a function or on the $attrs symbol, in case of a property, and adds these to the descriptor.
     *
     * @param {string|Symbol}  prop    - The property to be processed.
     * @param {Object}         dsc     - Property descriptor to be processed.
     * @param {Object=}        options - Options object
     *
     * @returns {Object} The processed descriptor.
     */
    _$processDescAttrs(prop, dsc, options={})
    {   "<$attrs static>";
        if(dsc.value && dsc.value[$dsc]) {return dsc.value} // value is already a cell-type.dsc so no further processing needed

        let tmp        = `${dsc.value || dsc.get || dsc.set}`.match(/<\$attrs(.*?)>/);
        let tmp2       = `${tmp? tmp[1] : dsc.value && dsc.value[$attrs] || ''}`.replace(/[\s]*([=\|\s])[\s]*/g, '$1'); // prettify: remove redundant white spaces
        let attributes = tmp2.match(/[!\$\w]+(=[\$\w]+(\|[\$\w]+)*)?/g)  || []; // filter attributes including values

        Prototype._$assignAttrsToDsc(attributes, prop, dsc, options);

        // if value is a descriptor set the value to the descriptor value
        if(dsc.value && dsc.value[$attrs] !== undefined) {dsc.value = dsc.value.value}

        return dsc
    },
    /**
     * @method Type#properties
     * @desc
     *         Adds properties to the type based on a properties object.
     *
     * @param {Object} props - The properties object.
     *
     * @returns {Type} this
     */
    properties(props)
    {
        Prototype._$extend(this.proto, props);

        return this
    },
    /**
     * @name Type#proto
     * @desc
     *       Accessor for the internal proto. So we can assure a proper proto is always returned.
     *       This proto is the output for the Type function.
     *
     * @type Object
     */
    get proto()
    {
        return this._proto || (this._proto = Prototype._$decorate({}, this)); // _$decorate a plain obj as type
    },
    set proto(p)
    {
        this._proto = p
    },
    state(props)
    {   if(props === undefined) {return this.proto[$defaults]}

        Prototype._$extend(this.proto, props, {state: true});

        return this
    },
    /**
     * @method Type#statics
     * @desc
     *         Defines statics properties. Allows one to omit the static attribute.
     *         Returns all static properties (Symbol('cell-type.statics')) in case no arguments are given.
     *
     * @param {Object} props - Object containing the static properties.
     *
     * @returns {Type|Object} this|object containing all static properties.
     */
    statics(props)
    {   if(props === undefined) {/*TODO crawl static properties*/}

        Prototype._$extend(this.proto, props, {static: true});

        return this
    },
    /**
     * @method Type#compose
     * @desc   **aliases:** with, mixin
     *
     * @param {...Object} protos
     *
     * returns {Type} this
     */
    compose(...protos)
    {   "<$attrs alias=with|mixin>";

        protos.forEach(proto => this.properties(proto[$type].model));

        return this
    },
    /**
     * @private
     * @method Type._$upperEnhanceProperty
     * @desc
     *         Upper enhances a property. Where the upper is fetched dynamically so one is able to change the prototype on the fly.
     *
     * @param {Object}        obj    - The owner of the property that needs to be enhanced.
     * @param {string|Symbol} prop   - The property that needs enhancement.
     * @param {Object}        dsc    - The property descriptor.
     * @param {string}        method - Method of the descriptor value|get|set.
     */
    // TODO move the upper method as a static property to the prototype
    _$upperEnhanceProperty(obj, prop, dsc, method)
    {   "<$attrs static>";
        const getPropertyDescriptor = Prototype.$getPropertyDescriptor;
        const getPrototypeOf        = Reflect.getPrototypeOf;
        const fn                    = dsc[method];

        efn[$owner] = obj;
        efn[$inner] = fn; // reference to retrieve the original function

        // TODO create different wrapping functions for statics, accessors, etc. for improved performance
        function efn(...args) {
            let type = this.hasOwnProperty($type) ? this : getPrototypeOf(this), tmp = type.upper, out;

            type.upper = (...args) => getPropertyDescriptor(getPrototypeOf(efn[$owner]), prop)[method].apply(this, args); // dynamically get the upper method
            out = fn.apply(this, args);
            type.upper = tmp;

            return out;
        }

        dsc[method] = efn
    },
    /**
     * @private
     * @method Type._$validate
     * @desc
     *         Validates the properties in the properties object.
     *
     * @param {Object}        obj   - The object that was extended with the properties.
     * @param {string|Symbol} prop  - The property to be processed.
     * @param {Object}        dsc   - The property descriptor.
     * @param {Object}        model - Object containing all descriptors of the properties currently processed.
     */
    _$validate(obj, prop, dsc, model)
    {   "<$attrs static>";
        if(!dsc.validate) {return}

        ['value', 'get', 'set'].forEach(method => {
            if(!dsc.hasOwnProperty(method)) {return} // continue

            Prototype._$validatePrivateUse(obj, prop, dsc, method);
            // Prototype._$validateStatics(obj, prop, dsc, method, model); // TODO use a proxy in debug mode to verify statics
            Prototype._$validateOverrides(obj, prop, dsc, method);
            Prototype._$validateOverwrites(obj, prop, dsc, method);
        });
    },
    /**
     * @private
     * @method Type._$validateOverrides
     * @desc
     *         Validates overrides and returns a warning in case a method/property is overriding another and no upper or no override attribute is present.
     *
     * @param {Object}        obj    - Owner of the property that needs validation
     * @param {string|Symbol} prop   - Property that needs validation.
     * @param {Object}        dsc    - Property descriptor.
     * @param {string}        method - Method that is evaluated value|get|set
     */
    _$validateOverrides(obj, prop, dsc, method)
    {   "<$attrs static>";
        const isFn            = dsc[method] instanceof Function;
        const methodWithUpper = isFn && RGX.upper.test(dsc[method]);

        if(!(prop in Object.getPrototypeOf(obj)) || dsc.override || methodWithUpper) {return}

        console.warn(`[${obj[$type].name || 'Type'}]: No overriding attribute ${isFn ? 'and not calling upper ' : ''}in overriding (${method}) property '${prop}'.`);
    },
    _$validateOverwrites(obj, prop, dsc, method)
    {   "<$attrs static>";

        if(!obj.hasOwnProperty(prop)) {return}

        console.warn(`[${obj[$type].name || 'Type'}]: Property (${method}) ${prop} is already defined and will be overwritten.`);
    },
    /**
     * @private
     * @method Type._$validatePrivateUse
     * @desc
     *         Validates illegal private use. i.e. properties starting with an underscore that are not called from this.
     *
     * @param {Object}        obj    - Owner of the property that needs validation
     * @param {string|Symbol} prop   - Property that needs validation.
     * @param {Object}        dsc    - Property descriptor.
     * @param {string}        method - Method that is evaluated value|get|set
     *
     * @returns {Error|undefined}
     */
    _$validatePrivateUse(obj, prop, dsc, method)
    {   "<$attrs static>";
        const matches = `${dsc[method]}`.match(RGX.illegalPrivateUse);
        // FIXME this does not match [prop]._private
        // FIXME This will incorrectly mark static privates
        if(typeof(dsc[method]) !== 'function' || !matches || dsc.static) {return}

        throw new Error(`[${obj[$type].name || 'Type'}]: Illegal use of private propert${matches.length > 1 ? 'ies' : 'y'} '${matches}' in (${method}) method '${prop}'.`)
    }
};

/**
 * @constructor Type
 * @desc
 *        Prototypal(OLOO) inheritance algorithm.
 *
 * @param  {Object} model - The model for the type.
 *
 * @return {Object} The constructed prototype.
 */
function Type(model)
{   // allow for omitting the new keyword
    const self = Type.prototype.isPrototypeOf(this) ? this : Object.create(Type.prototype);

    return self.init(model);
}
Type.prototype[$type] = { // fake type instance
    name: 'Type',
    model: {}
};
Type.prototype[$defaults] = {};
/**
 * @name Type.[Symbol('cell-type.statics')]
 * @type Object
 * @desc
 *       Object hidden behind a symbol to store all original statics.
 */
Type.prototype[$type].static = {
    upper: null
};
Prototype._$extend(Type.prototype, Prototype);

/*? if(MODULE_TYPE !== 'es6') {*/
return Type
});
/*? } */

