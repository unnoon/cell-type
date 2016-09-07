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

const dsc     = Symbol.for('cell-type.dsc');
const statics = Symbol.for('cell-type.statics');
const owner   = Symbol.for('cell-type.owner'); // symbol to store the owner of a function/object so we can get the proper super.
const inner   = Symbol.for('cell-type.inner'); // reference to the wrapped inner function
const meta    = Symbol.for('cell-type.meta');  // general symbol for meta data

const properties = {
    /**
     * @name Type.info
     * @desc
     *       Info object to hold general module information.

     * @type Object
     */
    info: {[dsc]: "static",
        "name"       : "cell-type",
        "description": "Prototypal inheritance algorithm supporting traits & dependency injection.",
        "version"    : "/*?= VERSION */",
        "url"        : "https://github.com/unnoon/cell-type"
    },
    settings: {[dsc]: "static",
        rgx: {
            upper:  /\bthis\._upper\b/, // make sure we don't mistake static _upper reference // FIXME change to super
            illegalPrivateUse: /\b(?!this)[\w\$]+\._[^_\.][\w\$]+\b/
        }
    },
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
    {   if(!name) {throw "Missing arg 'name' for Type."}

        this._type = null;
        
        return this
    },
    /**
     * @method Type.decorate
     * @desc   Decorates an object as a Type prototype object.
     *
     * @param {Object} type - The object to be decorated.
     *
     * @returns {Object} The decorated object.
     */
    decorate(type) {
    "@dsc: static";
    {
        return extend(type, {
            constructor: function Type() {}, // TODO constructor shizzle
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
    "@dsc: alias=inherits";
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
    const type = Type.prototype.isPrototypeOf(this) ? this : Object.create(Type.prototype);

    return type.init(name, options);
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
function extend(obj, properties)
{
    Object.keys(properties).forEach(prop => {
        let desc    = processDescAttrs(Object.getOwnPropertyDescriptor(properties, prop));
        let names   = desc.alias || []; names.unshift(prop);
        let symbol  = prop.match(/@@(.+)/); symbol = symbol ? symbol[1] : '';
        let addProp = function(obj, name) {if(symbol) {obj[Symbol[symbol]] = desc.value} else {Reflect.defineProperty(obj, name, desc)}};

        // TODO frozen, extensible, sealed, override

        names.forEach(name => {addProp(obj, name); if(desc.static) {addProp(obj.constructor, name)}});
    });

    return obj
}

/**
 * @func processDescAttrs
 * @desc
 *       processes any attributes passed to a function or on the special symbol, in case of a property, and adds these to the descriptor.
 *
 * @param {Object} desc - Property descriptor to be processed.
 *
 * @returns {Object} The processed descriptor.
 */
function processDescAttrs(desc)
{
    let tmp   = `${desc.value || desc.get || desc.set}`.match(/@dsc:(.*?);/);
    let tmp2  = `${tmp? tmp[1] : desc.value && desc.value[dsc] || ''}`.replace(/[\s]*([=\|\s])[\s]*/g, '$1'); // prettify: remove redundant white spaces
    let attrs = tmp2.match(/[!\$\w]+(=[\$\w]+(\|[\$\w]+)*)?/g) || []; // filter attributes including values
    let attr, value;

    for(attr of attrs)
    {   switch(true)
        {
            case(  !attr.indexOf('!')) : value = false;                  attr = attr.slice(1); break;
            case(!!~attr.indexOf('=')) : value = attr.match(/[\$\w]+/g); attr = value.shift(); break;
            default                    : value = true;
        }

        desc[attr] = value;
    }

    return desc
}

/*? if(MODULE_TYPE !== 'es6') {*/
return Type
});
/*? } */

