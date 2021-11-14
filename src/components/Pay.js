import React, { Component } from 'react'
import dai from '../dai.png'

class Pay extends Component{
    render(){
        return(
            <div className="paytab card mb-4">
                <div className="card-body">
                <span className="float-left text-muted custom-span">
                  <b className="b">Balance:</b> <div className="input-group-append">
                  <div className="input-group-text">
                  
                    <img src={dai} height='32' alt=""/>
                    &nbsp;&nbsp;&nbsp;{window.web3.utils.fromWei(this.props.daiTokenBalance, 'Ether')} mDAI 
                  </div>
                </div>
                </span>
                    <form className="mb-3" onSubmit={(event) => {
                            let amount
                            amount = this.input2.value.toString()
                            amount = window.web3.utils.toWei(amount, 'Ether')
                            let address = this.input1.value.toString()
                            this.props.sendTokens(amount,address)}}
                            
                            >
                        <div className="input-group mb-4">
                            <label className="input-group-text" >Address</label>
                            <input type="text"
                                ref={(input1) => { this.input1 = input1 }}
                                className="form-control form-control-lg" placeholder="Address" />
                        </div>
                        <div className="input-group mb-4">
                            <label className="input-group-text" >Amount</label>
                            <input type="text" 
                            ref={(input2) => { this.input2 = input2 }}
                            className="form-control form-control-lg" placeholder="Amount" />
                        </div>
                        <button className="btn btn-primary btn-lg btn-block" type="submit">Pay</button>
                    </form>
                    <a href="/" className="nav-link"><button className="btn btn-secondary btn-block" type="submit">Cancel</button></a>
                </div>
            </div>
        );
    }
}

export default Pay;