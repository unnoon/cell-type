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
    illegalPrivateUse: /\b(?!this)[\w\$]+\._[^_\.][\w\$]+\b/g,
    thisMethodUsage:   /\bthis\.[\$\w]+\b/g,
};

// symbols
const $type    = Symbol.for('cell-type');       // symbol for type data stored on the proto
const $attrs   = Symbol.for('cell-type.attrs');
const $state   = Symbol.for('cell-type.state');
const $owner   = Symbol.for('cell-type.owner'); // symbol to store the owner of a method so we can get the proper dynamic super.
const $inner   = Symbol.for('cell-type.inner'); // reference to the wrapped inner function
const $dsc     = Symbol.for('cell-type.dsc');   // symbol to tag an object as a cell-type descriptor

const properties = {
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
        this.name    = data.name || '';
        // TODO maybe split model into state/statics/methods
        this.model   = {}; // Where the key is the name|symbol and the value an extended descriptor including additional attributes.
        this.state_  = {};
        this.static  = {
            upper: null
        };
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
        const state = Object.assign({}, this.state_);
        let   proto = this.proto;

        while((proto = Object.getPrototypeOf(proto)) && proto[$type]) {Object.assign(state, proto[$type].state_)}

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
            [$type]:  {value: type}, // store the Type model
            [$state]: {get: () => type.crawlState()}, // dynamically get the state. TODO option to make this static
            upper:    {get: () => proto[$type].static.upper, set: (v) => proto[$type].static.upper = v, enumerable: true} // TODO check if a accessor is really necesary
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

            if(dsc.state)                    {this._$stateEnhance(obj, prop, dsc, method)}
            if(dsc.static && 'value' in dsc) {this._$staticEnhance(obj, prop, dsc, method)}
            if(RGX.upper.test(dsc[method]))  {this._$upperEnhanceProperty(obj, prop, dsc, method)}
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
            obj[$type].model[prop] = this._$processDescAttrs(prop, Object.getOwnPropertyDescriptor(properties, prop), options);
        });

        keys.forEach(prop => {
            let dsc   = obj[$type].model[prop];
            let names = dsc.alias || []; names.unshift(prop);

            this._$validate(obj, prop, dsc, obj[$type].model);
            this._$enhanceProperty(obj, prop, dsc);

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
    links(proto=void 0) {
    "<$attrs alias=inherits>";
    {   if(proto === undefined) {return Reflect.getPrototypeOf(this.proto)}

        this.proto = !this._proto
            ? this._$decorate(Object.create(proto), this)
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

        this._$assignAttrsToDsc(attributes, prop, dsc, options);

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
        this._$extend(this.proto, props);

        return this
    },
    /**
     * @name Type#proto
     * @desc
     *       Getter/setter for the internal proto. So we can assure a proper proto is always returned.
     *       This proto is the output for the Type function.
     *
     * @type Object
     */
    get proto()
    {
        return this._proto || (this._proto = this._$decorate({}, this)); // _$decorate a plain obj as type
    },
    set proto(p)
    {
        this._proto = p
    },
    state(props)
    {   if(props === undefined) {return this.proto[$state]}

        this._$extend(this.proto, props, {state: true});

        return this
    },
    _$stateEnhance(proto, prop, dsc, method)
    {   "<$attrs static>";

        // get state descriptor from model
        Reflect.defineProperty(proto[$type].state_, prop, {get: () => proto[$type].model[prop], enumerable: true})
    },
    /**
     * @private
     * @method Type._$staticEnhance
     * @desc
     *         Static Enhances a property. It will wrap properties into a getter/setter so one is able to set static values from this.
     *         In case of a readonly property a warning is given on a set.
     *         All properties & methods will be added to the $statics symbol on the prototype.
     *
     * @param {Object}        obj     - The owner of the property that needs to be enhanced.
     * @param {string|Symbol} prop    - The property that needs enhancement.
     * @param {Object}        dsc     - The property descriptor.
     * @param {string}        method  - The method that is currently processed value|get|set.
     */
    _$staticEnhance(obj, prop, dsc, method)
    {   "<$attrs static>";

        if(dsc[method] instanceof Function)
        {
            Reflect.defineProperty(obj[$type].static, prop, {get: () => obj[prop]})
        }
        else
        {
            Reflect.defineProperty(obj[$type].static, prop, dsc);
            this._$staticEnhanceProperty(obj, prop, dsc)
        }
    },
    _$staticEnhanceProperty(obj, prop, dsc)
    {   "<$attrs static>";

        eget[$owner] = eset[$owner] = obj;

        function eget()    {return eget[$owner][$type].static[prop]} // TODO $owner is unnecessary?!?
        function eset(val) {eset[$owner][$type].static[prop] = val}

        dsc.get = eget;
        dsc.set = dsc.writable ? eset : (val) => console.warn(`Trying to set value '${val}' on readonly (static) property '${prop}'.`);

        delete dsc.value;
        delete dsc.writable;
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
    {   if(props === undefined) {return this.proto[$type].static}

        this._$extend(this.proto, props, {static: true});

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
        const getPropertyDescriptor = Type.$getPropertyDescriptor;
        const getPrototypeOf        = Reflect.getPrototypeOf;
        const fn                    = dsc[method];

        efn[$owner] = obj;
        efn[$inner] = fn; // reference to retrieve the original function

        function efn(...args) {
            let tmp = this.upper, out;

            this.upper = (...args) => getPropertyDescriptor(getPrototypeOf(efn[$owner]), prop)[method].apply(this, args); // dynamically get the upper method
            out = fn.apply(this, args);
            this.upper = tmp;

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

            this._$validatePrivateUse(obj, prop, dsc, method);
            this._$validateNonStaticMethodUsage(obj, prop, dsc, method, model);
            this._$validateOverrides(obj, prop, dsc, method);
            this._$validateOverwrites(obj, prop, dsc, method);
        });
    },
    /**
     * @private
     * @method Type._$validateNonStaticMethodUsage
     * @desc
     *         Validates illegal use of non-static methods inside static methods.
     *         Note that this method will not check any methods called by using the syntax obj[method|$ymbol].
     *
     * @param {Object}        obj    - Owner of the property that needs validation
     * @param {string|Symbol} prop   - Property that needs validation.
     * @param {Object}        dsc    - Property descriptor.
     * @param {string}        method - Method that is evaluated value|get|set.
     * @param {Object}        props  - Object containing all descriptors of the properties currently processed.
     *
     * @returns {Error|undefined}
     */
    // TODO validate static this using some meta code or debug mode, simpler and more effective???
    _$validateNonStaticMethodUsage(obj, prop, dsc, method, props)
    {   "<$attrs static>";
        const matches = `${dsc[method]}`.match(RGX.thisMethodUsage);

        if(typeof(dsc[method]) !== 'function' || !dsc.static || !matches) {return}

        const illegalNonStaticProperties = [];
        const protos = this.$getPrototypesOf(obj); protos.unshift(obj);

        for(let prop of matches) {
            let name = prop.slice(prop.indexOf('.')+1);
            if(!(props[name] && props[name].static)) protoSearch : 
            {
                for(let proto of protos) {if(proto[$type] && proto[$type].static && proto[$type].static.hasOwnProperty(name)) {break protoSearch}}
                // if not found as a static push illegal non-static property to the array
                illegalNonStaticProperties.push(prop);
            }
        }

        if(!illegalNonStaticProperties.length) {return}

        throw new Error(`[${obj[$type].name || 'Type'}]: Illegal usage of non-static method${illegalNonStaticProperties.length > 1 ? 's' : ''} '${illegalNonStaticProperties}' in static method '${prop}'.`)
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
        if(typeof(dsc[method]) !== 'function' || !matches) {return}

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
Type.prototype[$state] = {};
/**
 * @name Type.[Symbol('cell-type.statics')]
 * @type Object
 * @desc
 *       Object hidden behind a symbol to store all original statics.
 */
Type.prototype[$type].static = {
    upper: null
};
properties._$extend(Type.prototype, properties);


/**
 * cloning function
 *
 * @param {string=} _mode_='shallow' - 'shallow|deep' can be omitted completely
 * @param {Object}   obj             - object to be cloned
 * @param {Array=}   visited_        - array of visited objects to check for circular references
 * @param {Array=}   clones_         - array of respective clones to fill circular references
 *
 * @returns {Object} - clone of the object
 */
function clone(_mode_, obj, visited_, clones_) {
    var mode = obj && _mode_ || 'shallow';
    var obj  = obj || _mode_;

    if(isPrimitive(obj)) {return obj}
    if(visited_ && ~visited_.indexOf(obj)) {return clones_[visited_.indexOf(obj)]}

    var cln = Array.isArray(obj)
        ? [] // otherwise chrome dev tools does not understand it is an array
        : Object.create(Object.getPrototypeOf(obj));

    visited_ = visited_ || [];
    clones_  = clones_  || [];

    visited_.push(obj);
    clones_.push(cln);

    Object.getOwnPropertyNames(obj).forEach(function(name) {
        var dsc = Object.getOwnPropertyDescriptor(obj, name);
        dsc.value = dsc.hasOwnProperty('value') && mode === 'deep'
            ? dsc.value = clone(mode, dsc.value, visited_, clones_)
            : dsc.value;

        Object.defineProperty(cln, name, dsc);
    });

    if(!Object.isExtensible(obj)) {Object.preventExtensions(cln)}
    if(Object.isSealed(obj))      {Object.seal(cln)}
    if(Object.isFrozen(obj))      {Object.freeze(cln)}

    return cln;
}

clone.deep = clone.bind(null, 'deep');

function isPrimitive(obj)
{
    var type = typeof(obj);
    return (obj === null || (type !== 'object' && type !== 'function'));
}

/**
 * local assign method including deep option
 *
 * @public
 * @method obj#assign
 *
 * @this {Object}
 *
 * @param {string=}        _mode_ - mode for assignation 'shallow'|'deep'. default is 'shallow'
 * @param {...Object} ___sources  - one or more object sources
 *
 * @return {Object} this - this after assignation
 */
function assign(_mode_, obj, ___sources)
{   "use strict";

    var mode = _mode_ === 'deep' || 'shallow' ? _mode_ : 'shallow';
    var i    = _mode_ === 'deep' || 'shallow' ? 2      : 1;
    var from;
    var to = obj;
    var symbols;

    for (; i < arguments.length; i++) {
        from = Object(arguments[i]);

        for (var key in from) {
            if (!from.hasOwnProperty(key)) {continue}

            if(mode === 'deep' && isObject(to[key]) && isObject(from[key]))
            {
                assign(mode, to[key], from[key])
            }
            else if(to.hasOwnProperty(key) && Object.getOwnPropertyDescriptor(to, key).writable === false)
            {

            }
            else
            {
                to[key] = from[key];
            }
        }

        if (Object.getOwnPropertySymbols) {
            symbols = Object.getOwnPropertySymbols(from);
            for (var s = 0; s < symbols.length; s++) {
                if (propIsEnumerable.call(from, symbols[s])) { // FIXME propIsEnumerable
                    to[symbols[s]] = from[symbols[s]];
                }
            }
        }
    }

    return to;
}

function isObject(obj) {return !isPrimitive(obj)}

/*? if(MODULE_TYPE !== 'es6') {*/
return Type
});
/*? } */

