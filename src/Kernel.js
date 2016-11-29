/*!
 * @author       Rogier Geertzema
 * @copyright    2016 Rogier Geertzema
 * @license      {@link https://github.com/unnoon/cell-type/blob/master/LICENSE|MIT License}
 * @overview     Prototypal(OLOO) inheritance algorithm.
 */
/*? if(MODULE_TYPE !== 'es6') {*/
!function(root, kernel) {
/* istanbul ignore next */ switch(true) {
/*amd*/    case typeof(define) === 'function' && root.define === define && !!define.amd : define(kernel);                                                         break;
/*node*/   case typeof(module) === 'object'   && root === module.exports                : module.exports = kernel();                                              break;
/*global*/ case !root.Kernel                                                            : Reflect.defineProperty(root, 'Kernel', {value: kernel(), enumerable: !0}); break; default : console.error("'Kernel' is already defined on root object")}
}(this, function kernel() { "use strict";
/*es6*//*? } else { write('export default Kernel\n\n') } *//*<3*/

const $defaults = Symbol.for('cell-type.defaults');
const $type     = Symbol.for('cell-type');

const Kernel = {
    types: new Map(),
    /**
     *
     * @param {Type} type
     * @param {Type} iface
     * @param {Type} implementation
     *
     * @returns {Kernel}
     */
    bind(type, iface, implementation)
    {
        // TODO allow iface to be a simple object
        let typeValue = this.types.get(type);

        if(!typeValue)         {this.types.set(type, typeValue = {})}
        if(!iface[$type].name) {throw new Error('No interface name provided')}
        // TODO check interface implementation

        typeValue[iface[$type].name] = implementation;

        return this
    },
    bindOnce()
    {
        // TODO
    },
    $pawn(type, iface, state)
    {
        let impl = this.types.get(type)[iface];

        let obj =  Object.assign(Object.create(impl, impl[$defaults]), state || {});

        return obj
    }
};

/*? if(MODULE_TYPE !== 'es6') {*/
return Kernel
});
/*? } */

