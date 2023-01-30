class EligibilityService {
	// Move to a more appropriate file.
	isObject(object) {
		return typeof object === "object";
	}

	handleAndCondition(actual, expected) {
		if (!this.isObject(expected)) {
			return false;
		}

		return Object.entries(expected).every(
			([key, value]) => !this.gatewayCondition(actual, key, value) || true,
		);
	}

	handleArrayCondition(actual, expected, condition) {
		if (!Array.isArray(expected)) {
			return false;
		}

		switch (condition) {
			case "in":
				return expected.some(value => [...actual].includes(value));
			case "or":
				return expected.some(value => this.checkValue(actual, value));
			default:
				return false;
		}
	}

	handleFilteringCondition(actual, expected, condition) {
		switch (condition) {
			case "gt":
				return actual > expected;
			case "gte":
				return actual >= expected;
			case "lt":
				return actual <= expected;
			case "lte":
				return actual < expected;
			default:
				return false;
		}
	}

	gatewayCondition(actual, conditionKey, conditionValue) {
		switch (conditionKey) {
			case "gt":
			case "gte":
			case "lt":
			case "lte":
				return this.handleFilteringCondition(
					actual,
					conditionValue,
					conditionKey,
				);
			case "in":
			case "or":
				return this.handleArrayCondition(actual, conditionValue, conditionKey);
			case "and":
				return this.handleAndCondition(actual, conditionValue);
			default:
				console.log(`❌ Condition ${conditionKey} doesn't exist.`);
				return false;
		}
	}

	handleAllConditions(actual, expected) {
		for (const condition in expected) {
			if (!this.gatewayCondition(actual, condition, expected[condition])) {
				return false;
			}
		}
		return true;
	}

	checkValue(actual, expected) {
		if (this.isObject(expected)) {
			return this.handleAllConditions(actual, expected);
		}

		return actual == expected;
	}

	findNestedObject(object, key) {
		const keys = key.split(".");

		if (keys.length !== 1) {
			const firstKey = keys.shift();

			if (object[firstKey] === undefined) {
				return undefined;
			}

			return this.findNestedObject(object[firstKey], keys.join("."));
		}

		if (Array.isArray(object)) {
			return object.map(element => element[key]);
		}
		return object[key];
	}

	checkEgibilityForOne(cart, key, criterias) {
		const value = this.findNestedObject(cart, key);

		if (value === undefined) {
			return false;
		}

		const expectedValue = criterias[key];

		const isEligible = this.checkValue(value, expectedValue);

		const parsedKey = key.split(".").join(" > ");

		if (!isEligible) {
			console.log(
				`❌ Bad value for ${parsedKey}. \nExpected : ${JSON.stringify(
					expectedValue,
				)} \Actual : ${value}`,
			);
		} else {
			console.log(`✅ Good value for ${parsedKey}.`);
		}

		return isEligible;
	}

	/**
	 * Compare cart data with criteria to compute eligibility.
	 * If all criteria are fulfilled then the cart is eligible (return true).
	 *
	 * @param cart
	 * @param criterias
	 * @return {boolean}
	 */
	isEligible(cart, criterias) {
		const keys = Object.keys(criterias);

		return keys.reduce(
			(prev, curr) => !prev || this.checkEgibilityForOne(cart, curr, criterias),
			true,
		);
	}
}

module.exports = {
	EligibilityService,
};
