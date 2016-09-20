/*!
 * @author       Rogier Geertzema
 * @copyright    2016 Rogier Geertzema
 * @license      {@link https://github.com/unnoon/cell-type/blob/master/LICENSE|MIT License}
 * @overview     Prototypal inheritance algorithm supporting traits & dependency injection.
 */
/*? if(MODULE_TYPE !== 'es6') {*/
!function(root, type) {
/* istanbul ignore next */ switch(true) {
/*amd*/    case typeof(define) === 'function' && root.define === define && !!define.amd : define(type);                                                              break;
/*node*/   case typeof(module) === 'object'   && root === module.exports                : module.exports = type();                                                   break;
/*global*/ case !root.Type                                                              : Reflect.defineProperty(root, 'Type', {value: type(), enumerable: !0}); break; default : console.error("'Type' is already defined on root object")}
}(this, function type() { "use strict";
/*es6*//*? } else { write('export default Type\n\n') } *//*<3*/

const ATTRS = ['static', 'alias', 'override', 'enumerable', 'configurable', 'writable', 'const', 'readonly', 'frozen', 'sealed', 'extensible', 'attached', 'solid'];
// symbols
const $type    = Symbol.for('cell-type');       // symbol for type data stored on the proto
const $attrs   = Symbol.for('cell-type.attrs');
const $statics = Symbol.for('cell-type.statics');
const $owner   = Symbol.for('cell-type.owner'); // symbol to store the owner of a function/object so we can get the proper dynamic super.
const $inner   = Symbol.for('cell-type.inner'); // reference to the wrapped inner function

const properties = {
    /**
     * @name Type.info
     * @desc
     *       Info object to hold general module information.

     * @type Object
     */
    info: {[$attrs]: "static frozen solid", value: {
        "name"       : "cell-type",
        "description": "Prototypal inheritance algorithm supporting traits & dependency injection.",
        "version"    : "/*?= VERSION */",
        "url"        : "https://github.com/unnoon/cell-type"
    }},
    settings: {[$attrs]: "static", value: { // TODO settings should be a state property
        rgx: {
            upper:             /\bthis\._upper\b/,
            illegalPrivateUse: /\b(?!this)[\w\$]+\._[^_\.][\w\$]+\b/g,
            thisUsage:         /\bthis(?!\.)\b/,  // TODO don't match 'this' in string values
            thisMethodUsage:   /\bthis\.[\$\w]+\b/g,
        }
    }},
    /**
     * @method Type#init
     * @desc
     *         Initializes the type.
     *
     * @param  {Object} model - The model for the type.
     *
     * @return {Object} The constructed prototype.
     */
    init(model)
    {   this._proto = null;
        // optional not necessarily unique name for debugging purposes
        this.name = model.name || '';

        if(model.links)      {this.links(model.links)}
        if(model.inherits)   {this.inherits(model.inherits)}
        if(model.statics)    {this.statics(model.statics)}
        if(model.properties) {this.properties(model.properties)}

        return this.proto
    },
    /**
     * @private
     * @method Type._assignAttrsToDsc
     *
     * @param {Array<string>} attributes - Array containing the attributes.
     * @param {Object}        dsc        - The descriptor to be extended with the attributes.
     */
    _assignAttrsToDsc(attributes, dsc)
    {
        dsc.enumerable = false; // default set enumerable to false

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

        if(dsc.solid || dsc.readonly || dsc.const) {dsc.writable     = false}
        if(dsc.solid || dsc.attached)              {dsc.configurable = false}
    },
    /**
     * @method Type.decorate
     * @desc
     *         Decorates an object as a Type prototype output object.
     *
     * @param {Object} proto - The object to be decorated.
     * @param {Type}   type  - Reference to the type object that will be stored under Symbol(cell-type).
     *
     * @returns {Object} The decorated prototype object.
     */
    decorate(proto, type) {
    "<$attrs static>";
    {
        return Object.assign(proto, {
            [$type]:     type, // store the Type model
            [$statics]:  { // stores static wrapped properties so they don't pollute the prototype
                _upper: null
            }
        });
    }},
    /**
     * @private
     * @method Type._enhanceProperty
     * @desc
     *         Enhances a property in case of _upper, statics, extensibility, sealing and freezing
     *
     * @param {Object}        obj  - The owner of the property that needs to be enhanced.
     * @param {string|Symbol} prop - The property that needs enhancement.
     * @param {Object}        dsc  - The property descriptor.
     */
    _enhanceProperty(obj, prop, dsc)
    {
        ['value', 'get', 'set'].forEach(method => {
            if(!dsc.hasOwnProperty(method)) {return} // continue

            if(dsc.static && 'value' in dsc)                          {this._staticEnhanceProperty(obj, prop, dsc, method)}
            if(properties.settings.value.rgx.upper.test(dsc[method])) {this._upperEnhanceProperty(obj, prop, dsc, method)}
            if(dsc.extensible === false)                              {Object.preventExtensions(dsc[method])}
            if(dsc.sealed)                                            {Object.seal(dsc[method])}
            if(dsc.frozen)                                            {Object.freeze(dsc[method])}
        });
    },
    /**
     * @private
     * @method Type._extend
     * @desc
     *         Extend function supporting validations/symbols/attributes etc.
     *
     * @param {Object}  obj        - object to extend.
     * @param {Object}  properties - object with the extend properties.
     * @param {Object=} options    - options object
     *
     * @returns {Object} the object after extension.
     */
    _extend(obj, properties, options={})
    {
        [...Object.getOwnPropertySymbols(properties), ...Object.keys(properties)].forEach(prop => {
            let dsc     = this._processDescAttrs(Object.getOwnPropertyDescriptor(properties, prop), options);
            let names   = dsc.alias || []; names.unshift(prop);

            this._enhanceProperty(obj, prop, dsc);

            names.forEach(name => {Object.defineProperty(obj, name, dsc); if(dsc.static && obj.constructor) {Object.defineProperty(obj.constructor, name, dsc)}});
        });

        this._validate(obj, properties);

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
     * @returns {Object|null} - the property descriptor or null in case no descriptor is found.
     */
    $getPropertyDescriptor(obj, prop)
    {   "<$attrs static>";
        if(obj.hasOwnProperty(prop)) {return Object.getOwnPropertyDescriptor(obj, prop)}

        while(obj = Object.getPrototypeOf(obj)) {if(obj.hasOwnProperty(prop)) {return Object.getOwnPropertyDescriptor(obj, prop)}}

        return null
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
            ? this.decorate(Object.create(proto), this)
            : Reflect.setPrototypeOf(this.proto, proto); // try to avoid this as it is slow.

        return this
    }},
    /**
     * @private
     * @method Type._processDescAttrs
     * @desc
     *       processes any attributes passed to a function or on the $attrs symbol, in case of a property, and adds these to the descriptor.
     *
     * @param {Object}  dsc     - Property descriptor to be processed.
     * @param {Object=} options - Options object
     *
     * @returns {Object} The processed descriptor.
     */
    _processDescAttrs(dsc, options={})
    {
        let tmp        = `${dsc.value || dsc.get || dsc.set}`.match(/<\$attrs(.*?)>/);
        let tmp2       = `${tmp? tmp[1] : dsc.value && dsc.value[$attrs] || ''}`.replace(/[\s]*([=\|\s])[\s]*/g, '$1'); // prettify: remove redundant white spaces
        let attributes = tmp2.match(/[!\$\w]+(=[\$\w]+(\|[\$\w]+)*)?/g)  || []; // filter attributes including values

        this._assignAttrsToDsc(attributes, dsc);
        Object.assign(dsc, options);

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
        this._extend(this.proto, props);

        return this
    },
    /**
     * @name Type#type
     * @desc
     *       Getter/setter for the internal type. So we can assure a proper proto is always returned.
     *
     * @type Object
     */
    get proto()
    {
        return this._proto || (this._proto = this.decorate({}, this)); // decorate a plain obj as type
    },
    set proto(p)
    {
        this._proto = p
    },
    /**
     * @private
     * @method Type._staticEnhanceProperty
     * @desc
     *         Static Enhances a property. It will wrap properties into a getter/setter so one is able to set static values from this.
     *         In case of a readonly property a warning is given on a set.
     *         All properties & methods will be added to the $statics symbol on the prototype.
     *
     * @param {Object}        obj  - The owner of the property that needs to be enhanced.
     * @param {string|Symbol} prop - The property that needs enhancement.
     * @param {Object}        dsc  - The property descriptor.
     */
    _staticEnhanceProperty(obj, prop, dsc, method)
    {
        Reflect.defineProperty(obj[$statics], prop, dsc); // add the original property to the special statics symbol

        if(dsc[method] instanceof Function) {return} // no further processing for static methods

        eget[$owner] = eset[$owner] = obj;

        function eget()    {return eget[$owner][$statics][prop]}
        function eset(val) {eset[$owner][$statics][prop] = val}

        dsc.get = eget;
        dsc.set = dsc.writable ? eset : (val) => console.warn(`Trying to set value '${val}' on readonly (static) property '${prop}'.`);

        delete dsc.value;
        delete dsc.writable;
    },
    /**
     * @method Type#statics
     * @desc
     *         Defines statics properties. Allows one to omit the static attribute.
     *         Returns all static properties ($statics) in case no arguments are given.
     *
     * @param {Object} props - Object containing the static properties.
     *
     * @returns {Type|Object} this|object containing all static properties.
     */
    statics(props)
    {   if(props === undefined) {return this.proto[$statics]}

        this._extend(this.proto, props, {static: true});

        return this
    },
    /**
     * @private
     * @method Type._upperEnhanceProperty
     * @desc
     *         Upper enhances a property. Where the upper is fetched dynamically so one is able to change the prototype on the fly.
     *
     * @param {Object}        obj  - The owner of the property that needs to be enhanced.
     * @param {string|Symbol} prop - The property that needs enhancement.
     * @param {Object}        dsc  - The property descriptor.
     */
    _upperEnhanceProperty(obj, prop, dsc, method)
    {
        const getPropertyDescriptor = Type.$getPropertyDescriptor;
        const getPrototypeOf        = Reflect.getPrototypeOf;
        const fn                    = dsc[method];

        efn[$owner] = obj;
        efn[$inner] = fn; // reference to retrieve the original function

        function efn(...args) {
            let tmp = this._upper, out;

            this._upper = (...args) => getPropertyDescriptor(getPrototypeOf(efn[$owner]), prop)[method].apply(this, args); // dynamically get the upper method
            out = fn.apply(this, args);
            this._upper = tmp;

            return out;
        }

        dsc[method] = efn
    },
    /**
     * @private
     * @method Type._validate
     * @desc
     *         Validates the properties in the properties object.
     *
     * @param {Object} obj        - The object that was extended with the properties.
     * @param {Object} properties - Object containing the properties that were used for extension and need to be validated.
     */
    _validate(obj, properties)
    {
        Object.keys(properties).forEach(prop => {
            let dsc = Object.getOwnPropertyDescriptor(properties, prop);

            ['value', 'get', 'set'].forEach(method => {
                if(!dsc.hasOwnProperty(method)) {return} // continue

                this._validatePrivateUse(obj, prop, dsc, method);
                this._validateStaticThisUsage(obj, prop, dsc, method);
                this._validateNonStaticMethodUsage(obj, prop, dsc, method);
                this._validateOverrides(obj, prop, dsc, method);
            });
        });
    },
    /**
     * @private
     * @method Type._validateNonStaticMethodUsage
     * @desc
     *         Validates illegal use of non-static methods inside static methods.
     *
     * @param {Object}        obj    - Owner of the property that needs validation
     * @param {string|Symbol} prop   - Property that needs validation.
     * @param {Object}        dsc    - Property descriptor.
     * @param {string}        method - Method that is evaluated value|get|set
     *
     * @returns {Error|undefined}
     */
    _validateNonStaticMethodUsage(obj, prop, dsc, method)
    {   const matches = `${dsc[method]}`.match(properties.settings.value.rgx.thisMethodUsage);

        if(typeof(dsc[method]) !== 'function' || !obj[$statics].hasOwnProperty(prop) || !matches) {return ``}

        const illegalNonStaticProperties = [];
        const protos = this.$getPrototypesOf(obj); protos.unshift(obj);

        for(let prop of matches) {
            method = prop.slice(prop.indexOf('.')+1);

            protoSearch : {
                for(let proto of protos) {if(proto[$statics] && proto[$statics].hasOwnProperty(method)) {break protoSearch}}
                // if not found as a static push illegal non-static property to the array
                illegalNonStaticProperties.push(prop);
            }
        }

        if(!illegalNonStaticProperties.length) {return ``}

        throw new Error(`[${obj[$type].name || 'Type'}]: Illegal usage of non-static method${illegalNonStaticProperties.length > 1 ? 's' : ''} '${illegalNonStaticProperties}' in static method '${prop}'.`)
    },
    /**
     * @private
     * @method Type._validateOverrides
     * @desc
     *         Validates overrides and returns a warning in case a method/property is overriding another and no _upper or no override attribute is present.
     *
     * @param {Object}        obj    - Owner of the property that needs validation
     * @param {string|Symbol} prop   - Property that needs validation.
     * @param {Object}        dsc    - Property descriptor.
     * @param {string}        method - Method that is evaluated value|get|set
     */
    _validateOverrides(obj, prop, dsc, method)
    {   const isFn            = dsc[method] instanceof Function;
        const methodWithUpper = isFn && properties.settings.value.rgx.upper.test(dsc[method]);

        if(!(prop in Object.getPrototypeOf(obj)) || dsc.override || methodWithUpper) {return}

        console.warn(`[${obj[$type].name || 'Type'}]: No overriding attribute ${isFn ? 'and not calling upper ' : ''}in overriding (${method}) property '${prop}'.`);
    },
    /**
     * @private
     * @method Type._validatePrivateUse
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
    _validatePrivateUse(obj, prop, dsc, method)
    {   const matches = `${dsc[method]}`.match(properties.settings.value.rgx.illegalPrivateUse);

        if(typeof(dsc[method]) !== 'function' || !matches) {return}

        throw new Error(`[${obj[$type].name || 'Type'}]: Illegal use of private propert${matches.length > 1 ? 'ies' : 'y'} '${matches}' in (${method}) method '${prop}'.`)
    },
    /**
     * @private
     * @method Type._validateStaticThisUsage
     * @desc
     *         Validates illegal use of this in static functions.
     *
     * @param {Object}        obj    - Owner of the property that needs validation
     * @param {string|Symbol} prop   - Property that needs validation.
     * @param {Object}        dsc    - Property descriptor.
     * @param {string}        method - Method that is evaluated value|get|set
     *
     * @returns {Error|undefined}
     */
    _validateStaticThisUsage(obj, prop, dsc, method)
    {   // FIXME get rgx from local settings
        const thisUsage = properties.settings.value.rgx.thisUsage.test(dsc[method]); // FIXME this is way to sensitive

        if(typeof(dsc[method]) !== 'function' || !obj[$statics].hasOwnProperty(prop) || !thisUsage) {return}

        throw new Error(`[${obj[$type].name || 'Type'}]: Illegal this usage in static method '${prop}'.`)
    },
    [$statics]: {}
};

/**
 * @constructor Type
 * @desc
 *        Prototypal inheritance algorithm supporting traits & dependency injection.
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

properties._extend(Type.prototype, properties);

/*? if(MODULE_TYPE !== 'es6') {*/
return Type
});
/*? } */

