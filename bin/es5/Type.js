'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/*!
 * @author       Rogier Geertzema
 * @copyright    2016 Rogier Geertzema
 * @license      {@link https://github.com/unnoon/cell-type/blob/master/LICENSE|MIT License}
 * @overview     Prototypal(OLOO) inheritance algorithm.
 */
!function (root, type) {
    /* istanbul ignore next */switch (true) {
        /*amd*/case typeof define === 'function' && root.define === define && !!define.amd:
            define(type);break;
        /*node*/case (typeof module === 'undefined' ? 'undefined' : _typeof(module)) === 'object' && root === module.exports:
            module.exports = type();break;
        /*global*/case !root.Type:
            Reflect.defineProperty(root, 'Type', { value: type(), enumerable: !0 });break;default:
            console.error("'Type' is already defined on root object");}
}(undefined, function type() {
    "use strict";
    /*es6*/ /*<3*/

    var _$info, _$attrs;

    var ATTRS = ['static', 'alias', 'override', 'enumerable', 'configurable', 'writable', 'const', 'readonly', 'frozen', 'sealed', 'extensible', 'attached', 'solid', 'validate'];
    var RGX = {
        upper: /\bthis\._upper\b/,
        illegalPrivateUse: /\b(?!this)[\w\$]+\._[^_\.][\w\$]+\b/g,
        thisUsage: /\bthis(?!\.)\b/, // TODO don't match 'this' in string values
        thisMethodUsage: /\bthis\.[\$\w]+\b/g
    };
    // TODO auto add static attribute based on $ prefix
    // symbols
    var $type = Symbol.for('cell-type'); // symbol for type data stored on the proto
    var $attrs = Symbol.for('cell-type.attrs');
    var $statics = Symbol.for('cell-type.statics');
    var $owner = Symbol.for('cell-type.owner'); // symbol to store the owner of a method so we can get the proper dynamic super.
    var $inner = Symbol.for('cell-type.inner'); // reference to the wrapped inner function

    var properties = _defineProperty({
        /**
         * @readonly
         * @name Type.$info
         * @desc
         *       Info object to hold general module information.
         *
         * @type Object
         */
        $info: (_$info = {}, _defineProperty(_$info, $attrs, "static frozen solid"), _defineProperty(_$info, 'value', {
            "name": "cell-type",
            "description": "Prototypal(OLOO) inheritance algorithm.",
            "version": "0.0.0",
            "url": "https://github.com/unnoon/cell-type"
        }), _$info),
        /**
         * @method Type#init
         * @desc
         *         Initializes the type.
         *
         * @param  {Object} model - The model for the type.
         *
         * @return {Object} The constructed prototype.
         */
        init: function init(model) {
            this._proto = null;
            // optional not necessarily unique name for debugging purposes
            this.name = model.name || '';

            if (model.links) {
                this.links(model.links);
            }
            if (model.inherits) {
                this.inherits(model.inherits);
            }
            if (model.statics) {
                this.statics(model.statics);
            }
            if (model.properties) {
                this.properties(model.properties);
            }

            return this.proto;
        },

        /**
         * @name Type.$attrs
         * @desc
         *       Array holding all possible attributes.
         *
         * @type Array
         */
        $attrs: (_$attrs = {}, _defineProperty(_$attrs, $attrs, "static"), _defineProperty(_$attrs, 'value', { ATTRS: ATTRS }), _$attrs),
        /**
         * @private
         * @method Type._$assignAttrsToDsc
         *
         * @param {Array<string>} attributes - Array containing the attributes.
         * @param {Object}        dsc        - The descriptor to be extended with the attributes.
         */
        _$assignAttrsToDsc: function _$assignAttrsToDsc(attributes, dsc) {
            "<$attrs static>";

            dsc.enumerable = false; // default set enumerable to false
            dsc.validate = true;

            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = attributes[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var attr = _step.value;
                    var value = void 0;
                    switch (true) {
                        case !attr.indexOf('!'):
                            value = false;attr = attr.slice(1);break;
                        case !!~attr.indexOf('='):
                            value = attr.match(/[\$\w]+/g);attr = value.shift();break;
                        default:
                            value = true;
                    }
                    if (!~ATTRS.indexOf(attr)) {
                        console.warn('\'' + attr + '\' is an unknown attribute and will not be processed.');
                    }

                    dsc[attr] = value;
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }

            if (dsc.solid || dsc.readonly || dsc.const) {
                dsc.writable = false;
            }
            if (dsc.solid || dsc.attached) {
                dsc.configurable = false;
            }
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
        _$decorate: function _$decorate(proto, type) {
            "<$attrs static>";

            {
                var _Object$assign;

                return Object.assign(proto, (_Object$assign = {}, _defineProperty(_Object$assign, $type, type), _defineProperty(_Object$assign, $statics, { // stores static wrapped properties so they don't pollute the prototype
                    _upper: null
                }), _Object$assign));
            }
        },

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
        _$enhanceProperty: function _$enhanceProperty(obj, prop, dsc) {
            "<$attrs static>";

            var _this = this;

            ['value', 'get', 'set'].forEach(function (method) {
                if (!dsc.hasOwnProperty(method)) {
                    return;
                } // continue

                if (dsc.static && 'value' in dsc) {
                    _this._$staticEnhanceProperty(obj, prop, dsc, method);
                }
                if (RGX.upper.test(dsc[method])) {
                    _this._$upperEnhanceProperty(obj, prop, dsc, method);
                }
                if (dsc.extensible === false) {
                    Object.preventExtensions(dsc[method]);
                }
                if (dsc.sealed) {
                    Object.seal(dsc[method]);
                }
                if (dsc.frozen) {
                    Object.freeze(dsc[method]);
                }
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
        _$extend: function _$extend(obj, properties) {
            "<$attrs static>";

            var _this2 = this;

            var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];
            var eprops = {};

            [].concat(_toConsumableArray(Object.getOwnPropertySymbols(properties)), _toConsumableArray(Object.keys(properties))).forEach(function (prop) {
                eprops[prop] = _this2._$processDescAttrs(prop, Object.getOwnPropertyDescriptor(properties, prop), options);
            });

            [].concat(_toConsumableArray(Object.getOwnPropertySymbols(eprops)), _toConsumableArray(Object.keys(eprops))).forEach(function (prop) {
                var dsc = eprops[prop];
                var names = dsc.alias || [];names.unshift(prop);

                _this2._$validate(obj, prop, dsc, eprops);
                _this2._$enhanceProperty(obj, prop, dsc);

                names.forEach(function (name) {
                    Object.defineProperty(obj, name, dsc);if (dsc.static && obj.constructor) {
                        Object.defineProperty(obj.constructor, name, dsc);
                    }
                });
            });

            return obj;
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
        $getPropertyDescriptor: function $getPropertyDescriptor(obj, prop) {
            "<$attrs static>";

            if (obj.hasOwnProperty(prop)) {
                return Object.getOwnPropertyDescriptor(obj, prop);
            }

            while (obj = Object.getPrototypeOf(obj)) {
                if (obj.hasOwnProperty(prop)) {
                    return Object.getOwnPropertyDescriptor(obj, prop);
                }
            }

            return null;
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
        $getPrototypesOf: function $getPrototypesOf(obj) {
            "<$attrs static>";

            var proto = obj,
                protos = [];

            while (proto = Object.getPrototypeOf(proto)) {
                protos.push(proto);
            }

            return protos;
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
        links: function links() {
            "<$attrs alias=inherits>";

            var proto = arguments.length <= 0 || arguments[0] === undefined ? void 0 : arguments[0];
            {
                if (proto === undefined) {
                    return Reflect.getPrototypeOf(this.proto);
                }

                this.proto = !this._proto ? this._$decorate(Object.create(proto), this) : Reflect.setPrototypeOf(this.proto, proto); // try to avoid this as it is slow.

                return this;
            }
        },

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
        _$processDescAttrs: function _$processDescAttrs(prop, dsc) {
            "<$attrs static>";

            var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];
            var tmp = ('' + (dsc.value || dsc.get || dsc.set)).match(/<\$attrs(.*?)>/);
            var tmp2 = ('' + (tmp ? tmp[1] : dsc.value && dsc.value[$attrs] || '')).replace(/[\s]*([=\|\s])[\s]*/g, '$1'); // prettify: remove redundant white spaces
            var attributes = tmp2.match(/[!\$\w]+(=[\$\w]+(\|[\$\w]+)*)?/g) || []; // filter attributes including values

            dsc.prop = prop;
            this._$assignAttrsToDsc(attributes, dsc);
            Object.assign(dsc, options);

            // if value is a descriptor set the value to the descriptor value
            if (dsc.value && dsc.value[$attrs] !== undefined) {
                dsc.value = dsc.value.value;
            }

            return dsc;
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
        properties: function properties(props) {
            this._$extend(this.proto, props);

            return this;
        },

        /**
         * @name Type#proto
         * @desc
         *       Getter/setter for the internal proto. So we can assure a proper proto is always returned.
         *       This proto is the output for the Type function.
         *
         * @type Object
         */
        get proto() {
            return this._proto || (this._proto = this._$decorate({}, this)); // _$decorate a plain obj as type
        },
        set proto(p) {
            this._proto = p;
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
        _$staticEnhanceProperty: function _$staticEnhanceProperty(obj, prop, dsc, method) {
            "<$attrs static>";

            Reflect.defineProperty(obj[$statics], prop, dsc); // add the original property to the special statics symbol

            if (dsc[method] instanceof Function) {
                return;
            } // no further processing for static methods

            eget[$owner] = eset[$owner] = obj;

            function eget() {
                return eget[$owner][$statics][prop];
            }
            function eset(val) {
                eset[$owner][$statics][prop] = val;
            }

            dsc.get = eget;
            dsc.set = dsc.writable ? eset : function (val) {
                return console.warn('Trying to set value \'' + val + '\' on readonly (static) property \'' + prop + '\'.');
            };

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
        statics: function statics(props) {
            if (props === undefined) {
                return this.proto[$statics];
            }

            this._$extend(this.proto, props, { static: true });

            return this;
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
        _$upperEnhanceProperty: function _$upperEnhanceProperty(obj, prop, dsc, method) {
            "<$attrs static !validate>";

            var getPropertyDescriptor = Type.$getPropertyDescriptor;
            var getPrototypeOf = Reflect.getPrototypeOf;
            var fn = dsc[method];

            efn[$owner] = obj;
            efn[$inner] = fn; // reference to retrieve the original function

            function efn() {
                var _this3 = this;

                for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                    args[_key] = arguments[_key];
                }

                var tmp = this._upper,
                    out = void 0;

                this._upper = function () {
                    for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
                        args[_key2] = arguments[_key2];
                    }

                    return getPropertyDescriptor(getPrototypeOf(efn[$owner]), prop)[method].apply(_this3, args);
                }; // dynamically get the upper method
                out = fn.apply(this, args);
                this._upper = tmp;

                return out;
            }

            dsc[method] = efn;
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
        _$validate: function _$validate(obj, prop, dsc, props) {
            "<$attrs static>";

            var _this4 = this;

            if (!dsc.validate) {
                return;
            }

            ['value', 'get', 'set'].forEach(function (method) {
                if (!dsc.hasOwnProperty(method)) {
                    return;
                } // continue

                _this4._$validatePrivateUse(obj, prop, dsc, method);
                _this4._$validateStaticThisUsage(obj, prop, dsc, method);
                _this4._$validateNonStaticMethodUsage(obj, prop, dsc, method, props);
                _this4._$validateOverrides(obj, prop, dsc, method);
            });
        },

        /**
         * @private
         * @method Type._$validateNonStaticMethodUsage
         * @desc
         *         Validates illegal use of non-static methods inside static methods.
         *
         * @param {Object}        obj    - Owner of the property that needs validation
         * @param {string|Symbol} prop   - Property that needs validation.
         * @param {Object}        dsc    - Property descriptor.
         * @param {string}        method - Method that is evaluated value|get|set.
         * @param {Object}        props  - Object containing all descriptors of the properties currently processed.
         *
         * @returns {Error|undefined}
         */
        _$validateNonStaticMethodUsage: function _$validateNonStaticMethodUsage(obj, prop, dsc, method, props) {
            "<$attrs static>";

            var matches = ('' + dsc[method]).match(RGX.thisMethodUsage);

            if (typeof dsc[method] !== 'function' || !dsc.static || !matches) {
                return;
            }

            var illegalNonStaticProperties = [];
            var protos = this.$getPrototypesOf(obj);protos.unshift(obj);

            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = matches[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var _prop = _step2.value;

                    var name = _prop.slice(_prop.indexOf('.') + 1); // FIXME will probably break with symbols add a test case
                    if (!(props[name] && props[name].static)) protoSearch: {
                        var _iteratorNormalCompletion3 = true;
                        var _didIteratorError3 = false;
                        var _iteratorError3 = undefined;

                        try {
                            for (var _iterator3 = protos[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                                var proto = _step3.value;
                                if (proto[$statics] && proto[$statics].hasOwnProperty(name)) {
                                    break protoSearch;
                                }
                            }
                            // if not found as a static push illegal non-static property to the array
                        } catch (err) {
                            _didIteratorError3 = true;
                            _iteratorError3 = err;
                        } finally {
                            try {
                                if (!_iteratorNormalCompletion3 && _iterator3.return) {
                                    _iterator3.return();
                                }
                            } finally {
                                if (_didIteratorError3) {
                                    throw _iteratorError3;
                                }
                            }
                        }

                        illegalNonStaticProperties.push(_prop);
                    }
                }
            } catch (err) {
                _didIteratorError2 = true;
                _iteratorError2 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion2 && _iterator2.return) {
                        _iterator2.return();
                    }
                } finally {
                    if (_didIteratorError2) {
                        throw _iteratorError2;
                    }
                }
            }

            if (!illegalNonStaticProperties.length) {
                return;
            }

            throw new Error('[' + (obj[$type].name || 'Type') + ']: Illegal usage of non-static method' + (illegalNonStaticProperties.length > 1 ? 's' : '') + ' \'' + illegalNonStaticProperties + '\' in static method \'' + prop + '\'.');
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
        _$validateOverrides: function _$validateOverrides(obj, prop, dsc, method) {
            "<$attrs static>";

            var isFn = dsc[method] instanceof Function;
            var methodWithUpper = isFn && RGX.upper.test(dsc[method]);

            if (!(prop in Object.getPrototypeOf(obj)) || dsc.override || methodWithUpper) {
                return;
            }

            console.warn('[' + (obj[$type].name || 'Type') + ']: No overriding attribute ' + (isFn ? 'and not calling upper ' : '') + 'in overriding (' + method + ') property \'' + prop + '\'.');
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
        _$validatePrivateUse: function _$validatePrivateUse(obj, prop, dsc, method) {
            "<$attrs static>";

            var matches = ('' + dsc[method]).match(RGX.illegalPrivateUse);

            if (typeof dsc[method] !== 'function' || !matches) {
                return;
            }

            throw new Error('[' + (obj[$type].name || 'Type') + ']: Illegal use of private propert' + (matches.length > 1 ? 'ies' : 'y') + ' \'' + matches + '\' in (' + method + ') method \'' + prop + '\'.');
        },

        /**
         * @private
         * @method Type._$validateStaticThisUsage
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
        _$validateStaticThisUsage: function _$validateStaticThisUsage(obj, prop, dsc, method) {
            "<$attrs static>";

            var thisUsage = RGX.thisUsage.test(dsc[method]); // FIXME Way to sensitive

            if (typeof dsc[method] !== 'function' || !dsc.static || !thisUsage) {
                return;
            }
            // FIXME adopt error message
            throw new Error('[' + (obj[$type].name || 'Type') + ']: Illegal self reference in static method \'' + prop + '\'.');
        }
    }, $statics, {});

    /**
     * @constructor Type
     * @desc
     *        Prototypal inheritance algorithm supporting traits & dependency injection.
     *
     * @param  {Object} model - The model for the type.
     *
     * @return {Object} The constructed prototype.
     */
    function Type(model) {
        // allow for omitting the new keyword
        var self = Type.prototype.isPrototypeOf(this) ? this : Object.create(Type.prototype);

        return self.init(model);
    }

    properties._$extend(Type.prototype, properties);

    return Type;
});
