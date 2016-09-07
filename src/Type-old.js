/*!
 * @author       Rogier Geertzema
 * @copyright    2016 Rogier Geertzema
 * @license      {@link https://github.com/unnoon/cell-type/blob/master/LICENSE|MIT License}
 * @overview     Fast JS Type implementation.
 */
/*? if(MODULE_TYPE !== 'es6') {*/
!function(root, type) {
    /* istanbul ignore next */ switch(true) {
        /*amd*/    case typeof(define) === 'function' && root.define === define && !!define.amd : define(type);                                                              break;
        /*node*/   case typeof(module) === 'object'   && root === module.exports                : module.exports = type();                                                   break;
        /*global*/ case !root.Type                                                              : Reflect.defineProperty(root, 'Type', {value: type(), enumerable: !0}); break; default : console.error("'Type' is already defined on root object")}
}(this, function type() { "use strict";
    /*es6*//*? } else { write('export {Type as CType};\nexport default Type.prototype\n\n') } *//*<3*/
// int32 consts
    const zero = 0|0;
    const one  = 1|0;
    var iid = 0; // incremental counter for instance id's

    const properties = {
        /**
         * @name Type.info
         * @type Object
         * @desc
         *       Info object to hold general module information.
         */
        "static info": {
            "name": "cell-type",
            "description": "Prototypal inheritance algorithm supporting traits & dependency injection.",
            "version": "/*?= VERSION */",
            "url": "https://github.com/unnoon/cell-type"
        },
    };

    Type.settings = {
        rgx_upper:  /\bthis\._upper\b/, // make sure we don't mistake static _upper reference
        rgx_illegalPrivateUse: /\b(?!this)[\w$]+\._[^_\.][\w$]+\b/,
        nonenumerables: true,
        warnOnMixinConflicts: true
    };

    /**
     * Creates and builds a type
     *
     * @public
     * @function
     *
     * @param  {String=} name      - name of the type.
     * @param  {Object=} _options - optional options object TODO implementation
     *
     * @return {Type} - the created type
     */
    //TODO add property origin to functions
    function Type(name, _options={})
    {   if(!name) throw "ERROR: name is mandatory";

        var type = {proto: {}};
        var ctors; // will hold all constructor functions

        type.singleton = !!_options.singleton;
        
        // Type static properties
        _.extend(type, {
            'constant name': name,
            'instances': [], // TODO check if this is handy. Array holding all the instances of this Type
            '!enumerable _uppers': [],  // primary upper appended with any traits (uppers[0] could be undefined in case no primary upper is given)
            '!enumerable _traits': [],  // array holding all the traits for this type
            '!enumerable _deps':   {},  // object holding all the dependencies for this type
            '!enumerable _interfaces': [],  // object holding the interfaces implemented
            /**
             * Sets the upper types. Only the first upper will pass instanceof check.
             * Any other uppers given will be implemented as traits. Although one can still use this.upper as a form of multiple inheritance
             * The first upper can be undefined in case one only want to use traits
             *
             * @public
             * @function
             *
             * @param  {...Type} uppers - one or multiple upper objects/traits
             *
             * @return {Type} - extended version of the type
             */
            'inherits': {aliases: 'uppers', value: function(...uppers)
            {   if(!uppers.length) {return type._uppers}

                var upper = uppers[0];

                if(upper)
                {
                    upper = convert(uppers); // convert upper in case we are dealing with a default js class
                    type.proto = Object.create(upper);
                }

                type._uppers = uppers;
                // extra uppers will be implemented as traits
                type.traits(...uppers.slice(1));

                return this;

                function convert(uppers)
                {   // TODO prefix statics with $
                    var upper        = uppers[0];
                    var isUpperClass = upper instanceof Function;

                    // if upper is a class instead of type then convert to a usable form
                    if(isUpperClass)
                    {
                        var onconflict = (msg, prop, dsc) => console.warn(`[constructing Type: ${type.name}] not assigning static prop: ${prop} to prototype while converting upper class due to conflicts`);
                        var action     = (msg, prop, dsc) => wrapStatic(prop, dsc);
                        var options    = {action, safe: true, onconflict};

                        upper.prototype.ctor = upper.prototype.constructor;
                        // TODO maybe use conversion also for traits
                        _.extend(upper.prototype, options, upper); // add static properties to prototype

                        upper = uppers[0] = upper.prototype;
                    }

                    return upper
                }
            }},
            /**
             * Mixes in the traits|Returns traits in array
             *
             * @public
             * @function
             *
             * @param {...Type} traits - The traits to mix into this type
             *
             * @return {Type|Array} - extended version of the type|Array containing all traits in case no input is given
             */
            'traits': function(...traits)
            {   if(!traits.length) {return type._traits}

                type._traits = traits; // store the traits on the type
                type._uppers._.unify(type._traits); // add traits also to uppers (only if not already added)

                type._traits._.each(trait => {
                    // prototype
                    _.extend(type.proto, {
                        exclude: 'ctor constructor __$type$__ spawn',
                        mode: 'values', clone: true, safe: true, hasOwnPropertyCheck: false, nonenumerables: Type.settings.nonenumerables,
                        onoverride: (msg, prop) => console.warn(`[constructing Type: ${type.name}] not assigning prop '${prop}' from trait '${trait.__$type$__.name}' due to conflicts with upper type`),
                        onoverwrite: Type.settings.warnOnMixinConflicts
                            ? (msg, prop) => console.warn(`[constructing Type: ${type.name}] not assigning prop '${prop}' from trait '${trait.__$type$__.name}' due to conflicts with a previous trait`) // TODO better warning message
                            : null
                    }, trait);

                    if(trait.ctor) {addCTOR(trait.ctor)} // add trait construct to the constructs wrapper
                });

                if(ctors)
                {
                    // reverse callback order so the first added trait ctor is executed last
                    if(ctors.callbacks) {ctors.callbacks().reverse()}
                    // set the correct ctor to the prototype
                    type.proto.ctor = ctors;
                }

                return type
            },
            'dependencies': function(dependencies={})
            {
                IOCC.initializeDepsForType(type._uppers, type._deps, dependencies);

                if(_.isEmpty(dependencies)) {return type._deps}

                return this
            },
            // TODO improve
            /**
             * Fake implements method to specify the main interface implemented.
             *
             * @param {...String} interfaces - the interfaces that are implemented.
             *
             * @returns {Array|Type}
             */
            'implements': function(...interfaces)
            {   if(!interfaces.length) {return type._interfaces}

                type._interfaces = interfaces;

                return this
            },
            /**
             * Adds and upper enhances all prototype properties based on the given model
             *
             * @public
             * @function
             *
             * @param {Object=} _dataProps_ - optional external properties coming for example from a data file
             * @param {Object} model        - model for prototype properties of the type
             *
             * @return {Type} - type
             */
            // TODO better to support multiple models
            'properties': function(_dataProps_, model)
            {
                var dataProps = model && _dataProps_ || {};
                var model     = model || _dataProps_;
                // TODO this is not so nice needs updating
                type.dependencies(); // update dependencies

                var rgx_upper             = Type.settings.rgx_upper;
                var rgx_illegalPrivateUse = Type.settings.rgx_illegalPrivateUse;

                var options = {
                    onoverride:  warningNotUsingUpper,       onoverridectx:  type,
                    onoverwrite: warningNotUsingUpperTrait,  onoverwritectx: type,
                    action:      validatePrivatesAndEnhance, actionctx:      type
                };

                // add properties to the prototype
                _.extend(type.proto, options, model);
                _.extend(type.proto, options, dataProps); // add external properties to proto

                // add the possibly batched ctor to the prototype
                type.proto.ctor = addCTOR(type.proto.ctor);// || function(){}; // add the possibly enhanced ctor or upper ctor
                type.proto.__$type$__ = type; // TODO maybe make non enumerable

                var state = {};

                /**
                 * Creates instance of the 'Type'
                 *
                 * @returns {Type}
                 */
                type.proto.spawn = function()
                {
                    var tiid = iid++; // TODO why can't we reference iid directly?

                    var instance = Object.create(type.proto);
                    instance._.constant('iid', tiid);
                    instance._upper = null; // holds the upper function reference

                    // EntityManager.add(instance); // we should add the instance before initializing deps

                    initializeDependencies(tiid, type._deps, instance);

                    // options for retrieving the state from the prototype
                    var options  = {
                        mode: 'values', nonenumerables: Type.settings.nonenumerables,
                        onoverride: null, hasOwnPropertyCheck: false, clone: true,
                        exclude: '__$type$__',
                        condition: (prop, dsc, proto, obj) => dsc._.owns('value') && _.not.isFunction(dsc.value) && proto.__$type$__, // copy only properties of Type prototypes
                        action: (msg, prop, dsc) => { // insert dependencies if needed
                            if(dsc.value && dsc.value.inject)
                            {
                                var depInfo = type._deps[dsc.value.inject];
                                dsc.value   = IOCC.get(depInfo.interface, depInfo.index, tiid);
                            }
                        }
                    };
                    // we need to crawl the state first otherwise it will not get the properties from the Entity
                    var st = _.extend({}, options, type.proto); // extend instance with proto state
                    instance._.assign('shallow', st); // FIXME why does this fail if set to deep?
                    instance._.assign('deep', state); // assign custom state

                    var output = type.proto.ctor ? type.proto.ctor.apply(instance, arguments) : undefined;
                    // TODO run post constructors
                    state = {};

                    return output || instance; // support types that return other objects or functions
                };

                /**
                 * Spawns instance in a specific state
                 *
                 */
                type.proto.spawn.state = function(...args)
                {
                    state = args[0] || state;

                    return type.proto.spawn(...args.slice(1));
                };

                return type.proto;

                function initializeDependencies(iid, deps, instance)
                {   if(_.isEmpty(deps)) {return}

                    IOCC.initObj(iid, deps, instance);
                }

                function warningNotUsingUpper(msg, prop, descriptor, obj)
                {
                    ['value', 'get', 'set']._.each(dtype => {var fn = descriptor[dtype];
                        if(!fn || typeof(fn) !== 'function') {return} // continue

                        if(!rgx_upper.test(fn) && prop in obj) {console.warn(`[constructing Type: ${type.name}] not calling upper in overriding property(${dtype}): ${prop}.`)}
                    });
                }

                function warningNotUsingUpperTrait(msg, prop, descriptor, obj)
                {
                    ['value', 'get', 'set']._.each(dtype => {var fn = descriptor[dtype];
                        if(!fn || typeof(fn) !== 'function') {return} // continue

                        if(!rgx_upper.test(fn) && prop in obj) {console.warn(`[constructing Type: ${type.name}] not calling upper in overriding trait property(${dtype}): ${prop}.`)}
                    });
                }

                function validatePrivatesAndEnhance(msg, prop, descriptor)
                {
                    // check if private properties are only called in this context i.e. type._*
                    validatePrivateUse(prop, descriptor);
                    // upper enhance any properties that use upper
                    enhanceProperty(prop, descriptor);

                    wrapStatic(prop, descriptor);

                    wrapDependencies(prop, descriptor);
                }

                function wrapDependencies(prop, dsc)
                {   if(!dsc.inject || _.not.isFunction(dsc.value)) {return}

                    dsc.value = IOCC.dependencyEnhance(dsc.value, dsc.inject.split(', '))
                }

                function validatePrivateUse(prop, descriptor)
                {
                    var match = descriptor.value && descriptor.value.toString().match(rgx_illegalPrivateUse);
                    if(match) {throw `[constructing Type: ${type.name}]: illegal use of private property ${match[0]} in method: ${prop}`}
                }

                function enhanceProperty(prop, descriptor) {
                    // wrap any functions using upper functionality
                    if(!_.isDescriptor(descriptor)) {return} // continue

                    ['value', 'get', 'set']._.each(method => {
                        if(!descriptor[method]) {return} // continue

                        if(rgx_upper.test(descriptor[method])) {upperEnhanceProperty(prop, descriptor, method)}
                    });
                }

                function upperEnhanceProperty(prop, descriptor, method)
                {
                    type._uppers._.each(_upper => {
                        if(!_upper) {return} // continue in case there is no main inheritance type given

                        return _upper._.each$Dsc((sdescriptor, sprop) => { // break upper wrapper has been defined
                            var  value =  descriptor[method];
                            var svalue = sdescriptor[method];

                            if(!svalue || sprop !== prop || typeof(svalue) !== 'function' || svalue === value) {return} // continue

                            descriptor[method] = upperEnhance(value, svalue);

                            return false; // break
                        })
                    });

                    /**
                     * Enhances a function to be able to use this._upper()
                     *
                     * @private
                     * @function
                     *
                     * @param  {Function} fn      - Function to enhance
                     * @param  {Function} upperFn - Super of the function.
                     *
                     * @return {Function} - enhanced function
                     */
                    // TODO get from upper prototype so we can change prototype functions on runtime
                    function upperEnhance(fn, upperFn)
                    {
                        return function () {
                            var tmp = this._upper;
                            var result;
                            this._upper = upperFn;
                            result = fn.apply(this, arguments);
                            this._upper = tmp;

                            return result;
                        };
                    }
                }
            }
        });

        type.dependencies.get = function(instance, asses)
        {
            return IOCC.getDependency(instance, asses);
        };
        
        // define and return the actual type
        return type;

        /**
         * Adds a constructor to the ctors var.
         * In case there are multiple ctors a function batcher object will be used.
         *
         * @private
         *
         * @param {Function=} ctor - optional constructor function
         *
         * @return {Function|Batcher}
         */
        function addCTOR(ctor=null)
        {
            switch(true)
            {
                case !ctor     :                                        break;
                case !ctors    : ctors = ctor;                          break;
                case !ctors.add: ctors = _.Batcher.create(ctors, ctor); break;
                default        : ctors.add(ctor);
            }

            return ctors
        }

        // if a property is static we should create a getter setter wrapper for it if it is a property
        function wrapStatic(prop, descriptor)
        {   if(!descriptor.static || !descriptor.value || typeof(descriptor.value) === 'function') {return}

            var value = descriptor.value;

            // turn descriptor into a getter/setter and wrap value in closure
            descriptor.get = () => value;
            descriptor.set = descriptor.writable ? (val) => value = val : () => console.warn(`can not set static property: ${prop}. Writable is set to false.`);
            delete descriptor.value;
            delete descriptor.writable;
        }
    }

    extend(Type, properties);

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
            let dsc      = Object.getOwnPropertyDescriptor(properties, prop);
            let attrs    = prop.match(/[\w\$\@]+/g); prop = attrs.pop();
            let aliases  = `${dsc.value || dsc.get || dsc.set}`.match(/@aliases:(.*?);/);
            let names    = aliases? aliases[1].match(/[\w\$]+/g) : []; names.unshift(prop);
            let symbol   = prop.match(/@@(.+)/); symbol = symbol ? symbol[1] : '';
            let addProp  = function(obj, name) {if(symbol) {obj[Symbol[symbol]] = dsc.value} else {Reflect.defineProperty(obj, name, dsc)}};

            names.forEach(name => {
                if(~attrs.indexOf('static')) {addProp(obj, name)}
                addProp(obj.prototype, name);
            });
        });

        return obj
    }
    /*? if(MODULE_TYPE !== 'es6') {*/
    return Type.prototype; // prefer prototypal inheritance
});
/*? } */

