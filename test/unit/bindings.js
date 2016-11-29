define([
    'Kernel',
    'test/unit/InjectionType',
	'test/unit/IPos',
	'test/unit/Pos'
], function(Kernel, InjectionType, IPos, Pos) {

	Kernel.bind(InjectionType, IPos, Pos);
});