import React, {Component} from 'react';


export default class PasswordSceneLock extends Component {
    constructor(props) {
        super(props);

        this.state = {
            scenePassword: this.props.params.action.params.scenePassword
        };
        this.handleChange = this.handleChange.bind(this);
    }

    handleChange(event) {
        this.props.setScenePassword(event.target.value)
    }

    render() {
        return (
            <div >
                <span className="h5peditor-label">Set a password to lock the scene</span>
                <span className="h5peditor-field-description">If left empty, the scene will be opened without a password prompt.</span>
                <input className="h5peditor-text" type="text" id="password-dude" aria-describedby="paddword" maxLength="255" value={this.props.params.action.params.scenePassword} onChange={this.handleChange} />
            </div>
        );
    }

};
