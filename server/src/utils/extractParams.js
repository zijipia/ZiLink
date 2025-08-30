export function extractParams(pattern, path) {
	const paramNames = [];
	const patternParts = pattern.split("/");
	patternParts.forEach((part) => {
		if (part.startsWith(":")) {
			paramNames.push(part.substring(1));
		}
	});

	const pathParts = path.split("/");
	const params = {};
	let paramIndex = 0;
	for (let i = 0; i < patternParts.length; i++) {
		if (patternParts[i].startsWith(":")) {
			params[paramNames[paramIndex++]] = pathParts[i];
		}
	}
	return params;
}
