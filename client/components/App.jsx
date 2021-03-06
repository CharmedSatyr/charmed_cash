'use strict'

/*** PACKAGES ***/
import React, { Component } from 'react'

/*** COMPONENTS ***/
import HighchartsJS from './Chart.jsx'
import Toggle from './Toggle.jsx'
import Next from './Next.jsx'

/*** CONTROLLERS ***/
import common from '../controllers/common.jsx'
import clientFuncsWS from '../controllers/io.client.jsx'

/*** MAIN ***/
export default class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      tickers: '',
      chartArr: [],
      toggleArr: [],
      warning: '',
      loading: ''
    }

    this.handleSubmit = this.handleSubmit.bind(this)
    this.addTicker = this.addTicker.bind(this)
    this.deleteTicker = this.deleteTicker.bind(this)
    this.makeToggles = this.makeToggles.bind(this)
    this.chartData = this.chartData.bind(this)
  }

  /* Task runner updates tickers, toggles, and displays from getTickers info */
  setTickers(tickers) {
    let set = new Promise((resolve, reject) => {
      let t = tickers
        .split(',')
        .sort()
        .join()
      console.log('t', t)
      this.setState({
        tickers: t
      })
      resolve(tickers)
    })
    set
      .then(() => {
        this.makeToggles()
      })
      .then(() => {
        let s
        this.state.tickers
          ? (s = 'Ready')
          : (s = 'Not following any tickers...')

        this.setState({
          loading: s
        })
      })
      .then(() => {
        this.chartData()
      })
  }

  /* Keeps tickers in sync between client and server (allowing near real time *
   * ticker sync among users on different devices.                            */
  getTickers() {
    this.setState({ loading: 'Getting tickers...' })
    clientFuncsWS.getTickersWS(1000, (err, result) => {
      if (this.state.tickers !== result) {
        this.setTickers(result)
      }
    })

    //Get updates from the server when new Kraken data is fetched and saved
    clientFuncsWS.kraFetchSaveWS(message => {
      //console.log(message)
    })

    //If after 1500 ms there are no tickers, default makeToggles
    setTimeout(() => {
      if (!this.state.tickers) {
        this.makeToggles()
      }
    }, 2000)
  }

  /* Generate on/off buttons based on valid tickers.               *
   * Several popular Kraken pairs will always be visible.          *
   * For other Kraken pairs, turning button off = unfollowing pair */
  makeToggles() {
    //Create the toggles
    //Baked in pairs
    const bakedIn = 'XETHZUSD,XXBTZUSD,XZECZUSD'
    //Dynamic pairs
    const dynamic = this.state.tickers
    //Both
    let complete
    dynamic.length > 0
      ? (complete = bakedIn + ',' + dynamic)
      : (complete = bakedIn)
    let c = complete.split(',').sort()
    //Deduplicate
    c = common.uniq(c)
    //Make the toggleArr
    const toggleArr = c.map((item, index) => {
      return (
        <Toggle
          pair={item}
          on={this.state.tickers.indexOf(item) > -1}
          add={this.addTicker}
          del={this.deleteTicker}
          key={index}
        />
      )
    })
    //set State
    this.setState({ toggleArr: toggleArr })
  }
  addTicker(pair) {
    clientFuncsWS.addTickerWS(pair, async response => {
      this.setState({ loading: await response })
    })
  }
  deleteTicker(xpair) {
    clientFuncsWS.removeTickerWS(xpair, async response => {
      this.setState({ loading: await response })
    })
  }
  /* Validate and save currency pair input, else warn if invalid */
  handleSubmit() {
    //Submit and start following a new trading pair
    const pair = common.prettyTickers(
      document.getElementById('pairEntry').value
    )
    this.setState({ loading: 'Validating ' + pair + '...' })
    //Check Kraken to see if it's a valid pair before adding to DB
    clientFuncsWS.kraCheckerWS(pair, response => {
      if (response.result) {
        this.addTicker(pair)
        this.setState({
          warning: ' ' + pair + ' added.',
          loading: 'Ready'
        })
        setTimeout(() => {
          this.setState({ warning: '' })
        }, 10000)
      } else {
        this.setState({
          warning: ' Something is wrong with this entry. No pairs added.',
          loading: 'Ready'
        })
        setTimeout(() => {
          this.setState({ warning: '' })
        }, 10000)
      }
    })
  }
  /* Chart the data saved on the server */
  chartData() {
    this.setState({ loading: 'Drawing chart...' })
    //Get data points for chart
    clientFuncsWS.chartDataWS(async result => {
      const chartArr = await result
        .map(item => {
          return [common.prettyTickers(item.name), item.data]
        })
        .sort() //This sort ensures the chart Legend is in ABC order
      //Chart the data
      this.setState({ chartArr: chartArr, loading: 'Ready' })
    })
  }
  componentWillMount() {
    //this.deleteTicker('ffff') //debug
    this.getTickers() //Boot up
  }
  componentDidMount() {
    this.setState({ loading: 'Welcome to Charmed Cash! Awaiting tickers...' })
  }
  render() {
    return (
      <main>
        <h3>
          Currently following: {this.state.tickers.split(',').join(', ')}
          <br />
          Status: {this.state.loading}
          <br />
          <Next fn={this.chartData} />
        </h3>
        <div className="chart">
          <HighchartsJS data={this.state.chartArr} />
        </div>
        <div>
          <label htmlFor="pairEntry">
            <h3>
              Enter a {' '}
              <a href="https://www.kraken.com/help/fees" target="_blank">
                Kraken.com trading pair
              </a>{' '}
              (e.g., BCHUSD)
            </h3>
            <input
              id="pairEntry"
              placeholder=" Type a currency pair here..."
              type="text"
            />
            <button onClick={this.handleSubmit}>Submit</button>
            {this.state.warning}
          </label>
          <br />
          <h3>Or toggle a currency pair below: </h3>
          {this.state.toggleArr}
        </div>
      </main>
    )
  }
}
