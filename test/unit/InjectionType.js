define([
    'src/Type',
], function(Type) {

    const $inject   = Symbol.for('cell-type.inject');

    const InjectionType = Type({
        state: {
            pos: {[$inject]: 'IPos', state: {x: 6, y: 8}}
        },
        properties: {
            $iaminjectiontype: true
        }
    });

    return InjectionType

});