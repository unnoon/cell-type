define([
    'src/Type',
    'test/unit/IPos'
], function(Type, IPos) {

    const Pos = Type({
        implements: [IPos],
        state: {
            x: 0,
            y: 0
        }
    });

    return Pos
});