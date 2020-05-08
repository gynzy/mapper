local util = import '../../drone-util/index.jsonnet';

local lib = 'mapper';

{
	testSteps: [
		util.test(lib, 'unit'),
	],
}
