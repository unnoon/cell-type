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
/*global*/ case !root.Kernel                                                               : Reflect.defineProperty(root, 'Kernel', {value: kernel(), enumerable: !0}); break; default : console.error("'Kernel' is already defined on root object")}
}(this, function kernel() { "use strict";
/*es6*//*? } else { write('export default Kernel\n\n') } *//*<3*/

/**
 * @constructor Kernel
 * @desc
 *        Inversion Of Control Container
 *
 * @return {Object} Inversion Of Control Container.
 */
function Kernel()
{

}

/*? if(MODULE_TYPE !== 'es6') {*/
return Kernel
});
/*? } */

