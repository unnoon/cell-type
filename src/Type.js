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
    settings: {[$attrs]: "static", value: {
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
     * @method Type.decorate
     * @desc
     *         Decorates an object as a Type prototype object.
     *
     * @param {Object} proto - The object to be decorated.
     * @param {Object} type  - Reference to the type object that will be stored under Symbol(cell-type).
     *
     * @returns {Object} The decorated object.
     */
    decorate(proto, type) {
    "<$attrs static>";
    {
        return Object.assign(proto, {
            constructor: function Type() {}, // TODO constructor support shizzle
            [$type]:     type, // store the Type model
            [$statics]:  { // stores static wrapped properties so they don't pollute the prototype
                _upper: null
            }
        });
    }},
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
        extend(this.proto, props);

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

        extend(this.proto, props, {static: true});

        return this
    }
};
// TODO check if maps are better to store $statics, $state etc.
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
// TODO add _upper as a proper static property
Type.prototype[$statics] = {_upper: null}; // object to store wrapped statics original versions.

extend(Type.prototype, properties);

/**
 * @func extend
 * @desc
 *       Very simple extend function including alias, static support.
 *
 * @param {Object}  obj        - object to extend.
 * @param {Object}  properties - object with the extend properties.
 * @param {Object=} options    - options object
 *
 * @returns {Object} the object after extension.
 */
// TODO Know that this code does not copy symbols. So a external extend/assign/adopt method is a must!
function extend(obj, properties, options={})
{
    Object.keys(properties).forEach(prop => {
        let dsc     = processDescAttrs(Object.getOwnPropertyDescriptor(properties, prop), options);
        let names   = dsc.alias || []; names.unshift(prop);
        let symbol  = prop.match(/@@(.+)/); symbol = symbol ? symbol[1] : '';
        let addProp = function(obj, name) {if(symbol) {obj[Symbol[symbol]] = dsc.value} else {Reflect.defineProperty(obj, name, dsc)}};

        enhanceProperty(obj, prop, dsc);

        names.forEach(name => {addProp(obj, name); if(dsc.static) {addProp(obj.constructor, name)}});
    });

    validate(obj, properties);

    return obj
}

/**
 * @func processDescAttrs
 * @desc
 *       processes any attributes passed to a function or on the special symbol, in case of a property, and adds these to the descriptor.
 *
 * @param {Object}  dsc     - Property descriptor to be processed.
 * @param {Object=} options - Options object
 *
 * @returns {Object} The processed descriptor.
 */
function processDescAttrs(dsc, options={})
{
    let tmp        = `${dsc.value || dsc.get || dsc.set}`.match(/<\$attrs(.*?)>/);
    let tmp2       = `${tmp? tmp[1] : dsc.value && dsc.value[$attrs] || ''}`.replace(/[\s]*([=\|\s])[\s]*/g, '$1'); // prettify: remove redundant white spaces
    let attributes = tmp2.match(/[!\$\w]+(=[\$\w]+(\|[\$\w]+)*)?/g)  || []; // filter attributes including values

    assignAttrsToDsc(attributes, dsc);
    Object.assign(dsc, options);

    // if value is a descriptor set the value to the descriptor value
    if(dsc.value && dsc.value[$attrs] !== undefined) {dsc.value = dsc.value.value}

    return dsc
}

function validate(obj, properties)
{
    let dsc;

    Object.keys(properties).forEach(prop => {
        dsc = Object.getOwnPropertyDescriptor(properties, prop);

        ['value', 'get', 'set'].forEach(method => {
            if(!dsc.hasOwnProperty(method)) {return} // continue

            validatePrivateUse(obj, prop, dsc, method);
            validateStaticThisUsage(obj, prop, dsc, method);
            validateOverrides(obj, prop, dsc, method);
        });
    });
}

function validatePrivateUse(obj, prop, dsc, method)
{   const matches = `${dsc[method]}`.match(properties.settings.value.rgx.illegalPrivateUse);

    if(typeof(dsc[method]) !== 'function' || !matches) {return}

    throw new Error(`[${obj[$type].name || 'Type'}]: Illegal use of private propert${matches.length > 1 ? 'ies' : 'y'} '${matches}' in (${method}) method '${prop}'.`)
}

function validateStaticThisUsage(obj, prop, dsc, method)
{   const matches   = `${dsc[method]}`.match(properties.settings.value.rgx.thisMethodUsage);
    const thisUsage = properties.settings.value.rgx.thisUsage.test(dsc[method]);
    let   out       = '';

    if(typeof(dsc[method]) !== 'function' || !obj[$statics].hasOwnProperty(prop) || (!thisUsage && !matches)) {return}

    if(thisUsage) {out += `[${obj[$type].name || 'Type'}]: Illegal this usage in static method '${prop}'.`}
    if(matches)   {
        const illegalNonStaticProperties = [];

        matches.forEach(prop => {if(!obj[$statics].hasOwnProperty(prop.slice(prop.indexOf('.')+1))) {illegalNonStaticProperties.push(prop)}});

        if(!illegalNonStaticProperties.length) {return}
        if(out) {out += `\n`}
        out += `[${obj[$type].name || 'Type'}]: Illegal usage of non-static method${illegalNonStaticProperties.length > 1 ? 's' : ''} '${illegalNonStaticProperties}' in static method '${prop}'.`;
    }

    throw new Error(out)
}

function validateOverrides(obj, prop, dsc, method)
{   const isFn            = dsc[method] instanceof Function;
    const methodWithUpper = isFn && properties.settings.value.rgx.upper.test(dsc[method]);

    if(!(prop in Object.getPrototypeOf(obj)) || dsc.override || methodWithUpper) {return}

    console.warn(`[${obj[$type].name || 'Type'}]: No overriding attribute ${isFn ? 'and not calling upper ' : ''}in overriding (${method}) property '${prop}'.`);
}

function assignAttrsToDsc(attributes, dsc)
{
    let attr, value;

    dsc.enumerable = false; // default set enumerable to false

    for(attr of attributes)
    {   switch(true)
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
}

function enhanceProperty(obj, prop, dsc)
{
    ['value', 'get', 'set'].forEach(method => {
        if(!dsc.hasOwnProperty(method)) {return} // continue

        if(dsc.static && 'value' in dsc)                          {staticEnhanceProperty(obj, prop, dsc, method)}
        if(properties.settings.value.rgx.upper.test(dsc[method])) {upperEnhanceProperty(obj, prop, dsc, method)}
        if(dsc.extensible === false)                              {Object.preventExtensions(dsc[method])}
        if(dsc.sealed)                                            {Object.seal(dsc[method])}
        if(dsc.frozen)                                            {Object.freeze(dsc[method])}
    });

}
function staticEnhanceProperty(obj, prop, dsc, method)
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
}

function upperEnhanceProperty(obj, prop, dsc, method)
{
    const fn = dsc[method];

    efn[$owner] = obj;
    efn[$inner] = fn;

    function efn(...args) {
        let tmp = this._upper, out;

        this._upper = (...args) => getPropertyDescriptor(Reflect.getPrototypeOf(efn[$owner]), prop)[method].apply(this, args); // dynamically get the upper method
        out = fn.apply(this, args);
        this._upper = tmp;

        return out;
    }

    dsc[method] = efn
}

/**
 * Gets the descriptor of a property in a prototype chain
 *
 * @param {Object} obj  - the object in the prototype chain
 * @param {string} prop - the name of the property
 *
 * @returns {Object} - the property descriptor
 */
function getPropertyDescriptor(obj, prop) 
{   if (obj.hasOwnProperty(prop)) {return Object.getOwnPropertyDescriptor(obj, prop)}

    while (obj = Object.getPrototypeOf(obj))
    {
        if (obj.hasOwnProperty(prop)) {return Object.getOwnPropertyDescriptor(obj, prop)}
    }

    return null
}

/*? if(MODULE_TYPE !== 'es6') {*/
return Type
});
/*? } */

