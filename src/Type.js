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

// int32 consts
const zero = 0|0;
const one  = 1|0;

let   iid  = 0|0; // incremental counter for instance id's

const $attrs   = Symbol.for('cell-type.dsc');
const $statics = Symbol.for('cell-type.statics');
const $ctx     = Symbol.for('cell-type.ctx');
const $owner   = Symbol.for('cell-type.owner'); // symbol to store the owner of a function/object so we can get the proper super.
const $inner   = Symbol.for('cell-type.inner'); // reference to the wrapped inner function
const $meta    = Symbol.for('cell-engine.meta');  // general symbol for meta data
const $type    = Symbol.for('cell-type');  // general symbol for meta data

const properties = {
    /**
     * @name Type.info
     * @desc
     *       Info object to hold general module information.

     * @type Object
     */
    info: {[$attrs]: "static", value: {
        "name"       : "cell-type",
        "description": "Prototypal inheritance algorithm supporting traits & dependency injection.",
        "version"    : "/*?= VERSION */",
        "url"        : "https://github.com/unnoon/cell-type"
    }},
    settings: {[$attrs]: "static", value: {
        rgx: {
            upper:  /\b\._upper\b/,
            illegalPrivateUse: /\b(?!this)[\w\$]+\._[^_\.][\w\$]+\b/
        }
    }},
    /**
     * @method Type#init
     * @desc
     *         Initializes the type.
     *
     * @param  {string} name     - name of the type.
     * @param  {Object=} options - optional options object TODO implementation
     *
     * @return {Type} new Type
     */
    init(name, options={})
    {   if(!name) {throw "Missing arg 'name' for Type.init."}

        this.name  = name;
        this._type = null;
        
        return this
    },
    /**
     * @method Type.decorate
     * @desc   Decorates an object as a Type prototype object.
     *
     * @param {Object} proto - The object to be decorated.
     *
     * @returns {Object} The decorated object.
     */
    decorate(proto) {
    "@attrs: static";
    {
        return Object.assign(proto, {
            constructor: function Type() {}, // TODO constructor shizzle
            [$type]:     this // store the Type model
        });
    }},
    /**
     * @method Type#links
     * @desc   **aliases:** inherits
     * #
     *         links/inherits another object(prototype).
     *         If one wants to use link/inherits it should be called as the first chained function.
     *
     * @param {Object} obj - The object(prototype) to be linked.
     *
     * @returns {Type} this
     */
    links(obj) {
    "@attrs: alias=inherits";
    {
        this.type = this.decorate(Object.create(obj));

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
        extend(this.type, props);

        return this
    },
    /**
     * @name Type#out
     * @desc
     *       Outputs the created type object
     *
     * @readonly
     * @type Object
     */
    get out()
    {
        return this.type;
    },
    /**
     * @name Type#type
     * @desc
     *       Getter/setter for the internal type. So we can assure a proper type is always set.
     *
     * @type Object
     */
    get type()
    {
        return this._type || (this._type = this.decorate({})); // decorate a plain obj as type
    },
    set type(t)
    {
        this._type = t
    }
};

/**
 * @class Type
 * @desc
 *        Prototypal inheritance algorithm supporting traits & dependency injection.
 *
 * @param  {string}  name    - name of the type.
 * @param  {Object=} options - optional options object TODO implementation
 *
 * @return {Type} new Type
 */
function Type(name, options={})
{   // allow for omitting the new keyword
    const self = Type.prototype.isPrototypeOf(this) ? this : Object.create(Type.prototype);

    return self.init(name, options);
}

extend(Type.prototype, properties);

/**
 * @func extend
 * @desc
 *       Very simple extend function including alias, static support.
 *
 * @param {Object} obj        - object to extend.
 * @param {Object} properties - object with the extend properties.
 *
 * @returns {Object} the object after extension.
 */
// TODO Know that this code does not copy symbols. So a external extend/assign/adopt method is a must!
function extend(obj, properties)
{
    Object.keys(properties).forEach(prop => {
        let dsc     = processDescAttrs(Object.getOwnPropertyDescriptor(properties, prop)); dsc.enumerable = false; // mimic default js behaviour for 'classes'
        let names   = dsc.alias || []; names.unshift(prop);
        let symbol  = prop.match(/@@(.+)/); symbol = symbol ? symbol[1] : '';
        let addProp = function(obj, name) {if(symbol) {obj[Symbol[symbol]] = dsc.value} else {Reflect.defineProperty(obj, name, dsc)}};

        enhanceProperty(obj, prop, dsc);

        // TODO frozen, extensible, sealed, override

        names.forEach(name => {addProp(obj, name); if(dsc.static) {addProp(obj.constructor, name)}});
    });

    return obj
}

/**
 * @func processDescAttrs
 * @desc
 *       processes any attributes passed to a function or on the special symbol, in case of a property, and adds these to the descriptor.
 *
 * @param {Object} dsc - Property descriptor to be processed.
 *
 * @returns {Object} The processed descriptor.
 */
function processDescAttrs(dsc)
{
    let tmp        = `${dsc.value || dsc.get || dsc.set}`.match(/@attrs:(.*?);/);
    let tmp2       = `${tmp? tmp[1] : dsc.value && dsc.value[$attrs] || ''}`.replace(/[\s]*([=\|\s])[\s]*/g, '$1'); // prettify: remove redundant white spaces
    let attributes = tmp2.match(/[!\$\w]+(=[\$\w]+(\|[\$\w]+)*)?/g) || []; // filter attributes including values
    let attr, value;

    for(attr of attributes)
    {   switch(true)
        {
            case(  !attr.indexOf('!')) : value = false;                  attr = attr.slice(1); break;
            case(!!~attr.indexOf('=')) : value = attr.match(/[\$\w]+/g); attr = value.shift(); break;
            default                    : value = true;
        }

        dsc[attr] = value;
    }
    // if value is a descriptor set the value to the descriptor value
    if(dsc.value && dsc.value[$attrs] !== undefined) {dsc.value = dsc.value.value}

    return dsc
}

function enhanceProperty(obj, prop, dsc)
{
    ['value', 'get', 'set'].forEach(method => {
        if(typeof(dsc[method]) !== 'function') {return} // continue

        if(properties.settings.value.rgx.upper.test(dsc[method])) {upperEnhanceProperty(obj, prop, dsc, method)}
    });
}

function upperEnhanceProperty(obj, prop, dsc, method)
{
    const fn = dsc[method];

    dsc[method] = upperEnhance(obj, prop, fn);

    function upperEnhance(obj, prop, fn)
    {
        const efn = function () {
            return fn.apply(efn[$ctx] = this, arguments);
        };

        efn[$owner] = obj; // store the owner of the function on the function itself. So we can change it dynamically.

        Reflect.defineProperty(efn, '_upper', {get: function() {
            return Reflect.getPrototypeOf(efn[$owner])[prop].bind(efn[$ctx]); // this is a bit fugly returning a newly bound function every time.
        }});

        return efn
    }
}

/*? if(MODULE_TYPE !== 'es6') {*/
return Type
});
/*? } */

