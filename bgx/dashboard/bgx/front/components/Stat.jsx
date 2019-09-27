// Copyright 2018 NTRlab
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
// -----------------------------------------------------------------------------

import React from 'react';
import { apiUrl } from '../actions/actions';
import { connect } from 'react-redux';

import Card from './Card';

class Stat extends React.Component {
  render() {
    const {identity, network} = this.props;
    const data = [
      [
        ['PubKey', identity.PubKey],
        ['KYCKey', identity.KYCKey],
        ['IP', identity.IP],
        ['Name', network],
      ],
      [
        ['Cluster Name', identity.Cluster],
        ['Parent Node',  identity.Parent],
        ['Leader', identity.Leader],
        ['Genesis', identity.Genesis]
      ],
    ];

    return (
      <div className='tab-offset'>
        <Card id="Identity" title='Identity'>
          <div className='row'>
            {
              data.map((dd) => {
                return (
                  <div key={dd[0][0]} className='col-6'>
                    {
                      dd.map((d) => {
                        if (typeof d[1] == 'undefined')
                          return null;

                        return (
                          <p key={d[0]}>
                            <strong>{d[0]}:</strong>
                            <span className='text-secondary'>{` ${d[1]}`}</span>
                          </p>
                        );
                      })
                    }
                  </div>
                )
              })
            }
          </div>
        </Card>
      </div>
    );
  }
}

export default connect (
    state => ({
      identity: state.blocksReducer.nodes.identity,
      network: state.blocksReducer.nodes.Network,
    }),
    null)(Stat);
