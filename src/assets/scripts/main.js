/*eslint-env node*/
/*eslint-env browser*/
var jQuery = require('jquery'),
    React = require('react');

class Foo extends React.Component {
  constructor() {
    super()
    console.log('foo');
  }

  render() {
    return (<div>Hi</div>);
  }
}
