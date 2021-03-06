'use strict'

/*** PACKAGES ***/
import React, { Component } from 'react'
import Switch from 'react-toggle-switch'

/*** FUNCTIONS ***/
import common from '../controllers/common.jsx'

/*** MAIN ***/
export default class Toggle extends Component {
  constructor(props) {
    super(props)
    this.state = {
      switched: this.props.on
    }
    this.toggleSwitch = this.toggleSwitch.bind(this)
  }
  toggleSwitch() {
    if (this.state.switched) {
      this.props.del(this.props.pair)
    } else {
      this.props.add(this.props.pair)
    }
    this.setState({ switched: !this.state.switched })
  }
  render() {
    return (
      <div className="toggleContainer">
        <span>{common.prettyTickers(this.props.pair)}</span>
        <Switch on={this.props.on} onClick={this.toggleSwitch} />
      </div>
    )
  }
}
