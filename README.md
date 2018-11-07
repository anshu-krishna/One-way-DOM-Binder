# DOMElementBinder
#### One-way DOM binder
This library provides a class called *DOMElementBinder* which facilitates an easy way for one-way DOM binding.
It allows us to specify the binding sites using a *moustache* like template.
## Example:
Binding sites can be  the *textContent* or the *attribute value*. For example
```html
<div id="mydiv">
	Name: {{name}}; Age: {{age}};
	<div>
		Name: <b>{{name}}</b>; Age: <b>{{age}}</b>;
	</div>
	<div data-test="Name: {{name}}; Age: {{age}};"></div>
	<span data-name="{{name}}" data-age="{{age}}"></span>
</div>
```
Now we can link the *#mydiv* node to a binder object
```javascript
let binder = new DOMElementBinder(document.querySelector("#mydiv"));
```
This binder object will now provide the variables that are binded to the specified sites.
```javascript
binder.name = "Anshu";
binder.age = 25;
```
The above assignments will be automatically reflected in the DOM as
```html
<div id="mydiv">
	Name: Anshu; Age: 25;
	<div>
		Name: <b>Anshu</b>; Age: <b>25</b>;
	</div>
	<div data-test="Name: Anshu; Age: 25;"></div>
	<span data-name="Anshu" data-age="25"></span>
</div>
```