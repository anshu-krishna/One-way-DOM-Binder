/*
Author: Anshu Krishna
Contact: anshu.krishna5@gmail.com
Date: 02-Sep-2018
*/
class DOMElementBinder {
	constructor(...elements) {
		Object.defineProperty(this, "__props", {
			enumerable: false,
			writable: true
		});
		this.__props = {};
		this.bindElements(...elements);
	}
	bindElements(...elements) {
		for (let element of elements) {
			if (element instanceof HTMLElement) {
				this.__extractTemplate(element);
			}
		}
		return this;
	}
	unbindElements(...elements) {
		for (let element of elements) {
			if (element instanceof HTMLElement) {
				this.__removeTemplate(element);
				element.normalize();
			}
		}
		return this;
	}
	__removeTemplate(element) {
		for (let p in this.__props) {
			for (let i in this.__props[p].templates) {
				let temp = this.__props[p].templates[i];
				if ((temp instanceof Node) && !element.contains(temp)) continue;
				if ((temp.attribute instanceof Node) && !element.contains(temp.attribute.ownerElement)) continue;
				delete this.__props[p].templates[i];
			}
			this.__props[p].templates = this.__props[p].templates.filter(v => v !== undefined);
		}
	}
	__extractTemplate(element) {
		let pattern = /({{[_a-zA-Z][_a-zA-Z0-9]*}})/;
		let nodes = Array.from(element.childNodes);
		for (let n of nodes) {
			if (n.nodeType != 3) continue;
			if (!n.nodeValue.match(pattern)) continue;
			let parts = n.nodeValue.split(pattern);
			parts.forEach((v, i) => {
				if (i % 2 == 0) {
					element.insertBefore(document.createTextNode(v), n);
				} else {
					let prop = v.slice(2, -2);
					let replaceable = document.createTextNode(prop);
					element.insertBefore(replaceable, n);
					if (typeof this[prop] == "undefined") this.addProperty(prop);
					this.__props[prop].templates.push(replaceable);
					this.__applyValueToTemplate(prop);
				}
			});
			element.removeChild(n);
		}
		for (let attr of element.attributes) {
			if (!attr.value.match(pattern)) continue;
			let parts = attr.value.split(pattern);
			let attrProps = new Set(parts.filter((v, i) => i % 2 != 0).map(v => v.slice(2, -2)));
			for (let prop of attrProps) {
				if (typeof this[prop] == "undefined") this.addProperty(prop);
				this.__props[prop].templates.push({
					attribute: attr,
					value: parts.map((v, i) => (i % 2 == 0) ? v : v.slice(2, -2))
				});
				this.__applyValueToTemplate(prop);
			}
		}

		for (let child of element.children) {
			this.__extractTemplate(child);
		}
	}
	__applyValueToTemplate(prop, index = null) {
		if (index === null) {
			index = this.__props[prop].templates.length - 1;
		}
		let template = this.__props[prop].templates[index];
		if (template instanceof Node) {
			let value = this[prop],
				clone;
			if (value instanceof Node) {
				clone = value.cloneNode(true);
			} else if (typeof value == "object") {
				try {
					clone = JSON.stringify(value);
				} catch (error) {
					clone = "JSON ERROR";
				}
				clone = document.createTextNode(clone);
			} else {
				clone = document.createTextNode(value);
			}
			template.parentNode.replaceChild(clone, template);
			this.__props[prop].templates[index] = clone;
		} else if (typeof template == "object") {
			let value = template.value.map((v, i) => {
				if (i % 2 == 0) return v;
				let val = this[v];
				if (val instanceof Node) {
					val = (val.nodeType == 1) ? val.innerText : val.nodeValue;
				} else if (typeof val == "object") {
					try {
						val = JSON.stringify(val);
					} catch (error) {
						val = "JSON ERROR";
					}
				}
				return val;
			});
			template.attribute.value = value.join("");
		}
	}
	addProperty(name, value) {
		if (typeof this[name] != "undefined") {
			if (value === undefined) return;
			this[name] = value;
			return;
		}
		if (value === undefined) value = name;
		this.__props[name] = { value: value, templates: [] };
		Object.defineProperty(this, name, {
			enumerable: true,
			get: () => this.__props[name].value,
			set: (value) => {
				this.__props[name].value = value;
				for (let index in this.__props[name].templates) {
					this.__applyValueToTemplate(name, index);
				}
			}
		});
	}
}

class DOMDocumentBinder {
	static get binders() {
		return window.__ELEMENT_BINDERS_LIST;
	}
	static init() {
		window.__ELEMENT_BINDERS_LIST = {};
		DOMDocumentBinder.parseDocument();
	}
	static parseDocument() {
		let elements = document.querySelectorAll("[data-binder]:not([data-binder-bound])");
		for (let e of elements) {
			let obj = e.getAttribute("data-binder");
			if (typeof window.__ELEMENT_BINDERS_LIST[obj] == "undefined") {
				window.__ELEMENT_BINDERS_LIST[obj] = new DOMElementBinder(e);
			} else {
				(window.__ELEMENT_BINDERS_LIST[obj]).bindElements(e);
			}
		}
	}
}