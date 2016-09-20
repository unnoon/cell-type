/*!
 * @author       Rogier Geertzema
 * @copyright    2016 Rogier Geertzema
 * @license      {@link https://github.com/unnoon/cell-type/blob/master/LICENSE|MIT License}
 * @overview     Prototypal(OLOO) inheritance algorithm.
 */
export default Type

/*<3*/

const ATTRS = ['static', 'alias', 'override', 'enumerable', 'configurable', 'writable', 'const', 'readonly', 'frozen', 'sealed', 'extensible', 'attached', 'solid', 'validate'];
const RGX   = {
    upper:             /\bthis\._upper\b/,
    illegalPrivateUse: /\b(?!this)[\w\$]+\._[^_\.][\w\$]+\b/g,
    thisMethodUsage:   /\bthis\.[\$\w]+\b/g,
};

// symbols
const $type    = Symbol.for('cell-type');       // symbol for type data stored on the proto
const $attrs   = Symbol.for('cell-type.attrs');
const $statics = Symbol.for('cell-type.statics');
const $owner   = Symbol.for('cell-type.owner'); // symbol to store the owner of a method so we can get the proper dynamic super.
const $inner   = Symbol.for('cell-type.inner'); // reference to the wrapped inner function

const properties = {
    /**
     * @readonly
     * @name Type.$info
     * @desc
     *       Info object to hold general module information.
     *
     * @type Object
     */
    $info: {[$attrs]: "static frozen solid", value: {
        "name"       : "cell-type",
        "description": "Prototypal(OLOO) inheritance algorithm.",
        "version"    : "0.0.1",
        "url"        : "https://github.com/unnoon/cell-type"
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
     * @name Type.$attrs
     * @desc
     *       Array holding all possible attributes.
     *
     * @type Array
     */
    $attrs: {[$attrs]: "static", value: {ATTRS}},
    /**
     * @private
     * @method Type._$assignAttrsToDsc
     *
     * @param {Array<string>} attributes - Array containing the attributes.
     * @param {Object}        dsc        - The descriptor to be extended with the attributes.
     */
    _$assignAttrsToDsc(attributes, dsc)
    {   "<$attrs static>";
        dsc.enumerable = false; // default set enumerable to false
        dsc.validate   = true;

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
        return Object.assign(proto, {
            [$type]:     type, // store the Type model
            [$statics]:  { // stores static wrapped properties so they don't pollute the prototype
                _upper: null
            }
        });
    }},
    /**
     * @private
     * @method Type._$enhanceProperty
     * @desc
     *         Enhances a property in case of _upper, statics, extensibility, sealing and freezing
     *
     * @param {Object}        obj  - The owner of the property that needs to be enhanced.
     * @param {string|Symbol} prop - The property that needs enhancement.
     * @param {Object}        dsc  - The property descriptor.
     */
    _$enhanceProperty(obj, prop, dsc)
    {   "<$attrs static>";
        ['value', 'get', 'set'].forEach(method => {
            if(!dsc.hasOwnProperty(method)) {return} // continue

            if(dsc.static && 'value' in dsc) {this._$staticEnhanceProperty(obj, prop, dsc, method)}
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

        const keys   = [...Object.getOwnPropertySymbols(properties), ...Object.keys(properties)];
        const eprops = {};

        keys.forEach(prop => {
            eprops[prop] = this._$processDescAttrs(prop, Object.getOwnPropertyDescriptor(properties, prop), options);
        });

        keys.forEach(prop => {
            let dsc   = eprops[prop];
            let names = dsc.alias || []; names.unshift(prop);

            this._$validate(obj, prop, dsc, eprops);
            this._$enhanceProperty(obj, prop, dsc);

            names.forEach(name => {
                Object.defineProperty(obj, name, dsc);
                if(dsc.static && obj.hasOwnProperty('constructor')) {Object.defineProperty(obj.constructor, name, dsc)}});
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
     * @returns {Object|undefined} - the property descriptor or null in case no descriptor is found.
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
        let tmp        = `${dsc.value || dsc.get || dsc.set}`.match(/<\$attrs(.*?)>/);
        let tmp2       = `${tmp? tmp[1] : dsc.value && dsc.value[$attrs] || ''}`.replace(/[\s]*([=\|\s])[\s]*/g, '$1'); // prettify: remove redundant white spaces
        let attributes = tmp2.match(/[!\$\w]+(=[\$\w]+(\|[\$\w]+)*)?/g)  || []; // filter attributes including values

        dsc.prop = prop;
        this._$assignAttrsToDsc(attributes, dsc);
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
    /**
     * @private
     * @method Type._$staticEnhanceProperty
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
    _$staticEnhanceProperty(obj, prop, dsc, method)
    {   "<$attrs static>";
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
     *         Returns all static properties (Symbol('cell-type.statics')) in case no arguments are given.
     *
     * @param {Object} props - Object containing the static properties.
     *
     * @returns {Type|Object} this|object containing all static properties.
     */
    statics(props)
    {   if(props === undefined) {return this.proto[$statics]}

        this._$extend(this.proto, props, {static: true});

        return this
    },
    /**
     * @private
     * @method Type._$upperEnhanceProperty
     * @desc
     *         Upper enhances a property. Where the upper is fetched dynamically so one is able to change the prototype on the fly.
     *
     * @param {Object}        obj  - The owner of the property that needs to be enhanced.
     * @param {string|Symbol} prop - The property that needs enhancement.
     * @param {Object}        dsc  - The property descriptor.
     */
    _$upperEnhanceProperty(obj, prop, dsc, method)
    {   "<$attrs static !validate>";
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
     * @method Type._$validate
     * @desc
     *         Validates the properties in the properties object.
     *
     * @param {Object}        obj   - The object that was extended with the properties.
     * @param {string|Symbol} prop  - The property to be processed.
     * @param {Object}        dsc   - The property descriptor.
     * @param {Object}        props - Object containing all descriptors of the properties currently processed.
     */
    _$validate(obj, prop, dsc, props)
    {   "<$attrs static>";
        if(!dsc.validate) {return}

        ['value', 'get', 'set'].forEach(method => {
            if(!dsc.hasOwnProperty(method)) {return} // continue

            this._$validatePrivateUse(obj, prop, dsc, method);
            this._$validateNonStaticMethodUsage(obj, prop, dsc, method, props);
            this._$validateOverrides(obj, prop, dsc, method);
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
                for(let proto of protos) {if(proto[$statics] && proto[$statics].hasOwnProperty(name)) {break protoSearch}}
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
     *         Validates overrides and returns a warning in case a method/property is overriding another and no _upper or no override attribute is present.
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

        if(typeof(dsc[method]) !== 'function' || !matches) {return}

        throw new Error(`[${obj[$type].name || 'Type'}]: Illegal use of private propert${matches.length > 1 ? 'ies' : 'y'} '${matches}' in (${method}) method '${prop}'.`)
    },
    /**
     * @name Type#[Symbol('cell-type.statics')]
     * @type Object
     * @desc
     *       Object hidden behind a symbol to store all original statics.
     */
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

properties._$extend(Type.prototype, properties);


