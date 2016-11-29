define([
    'src/Type'
], function(Type) {

    const IPos = Type({
        name: 'IPos',
        state: {
            x: 0,
            y: 0
        }
    });

    return IPos
});