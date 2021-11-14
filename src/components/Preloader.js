import { Component } from "react";
import React from "react";
import ReactLoading from "react-loading";

class Preloader extends Component{
    render(){
        return(
            <div className="MyDiv">
            <ReactLoading type={"bars"} color={"#03fc4e"} height={200} width={200}></ReactLoading>
            </div>
        )
    }
}

export default Preloader;