# Copyright 2019 NTRLab
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
# ------------------------------------------------------------------------------
import logging
import copy
import time
import random
import os
import binascii
import json

from enum import Enum

LOGGER = logging.getLogger(__name__)
TOPOLOGY_SET_NM = 'bgx.consensus.pbft.nodes'
class PeerSync():
    inactive = 'inactive'
    active   = 'active'
    nosync   = 'nosync'

class PeerRole():
    leader = 'leader'
    plink  = 'plink'

class PeerAtr():
    endpoint   = 'endpoint'
    component  = 'component'
    node_state = 'node_state'
    cluster    = 'cluster'
    children   = 'children'
    name       = 'name'
    role       = 'role'
    delegate   = 'delegate'
    genesis    = 'genesis'
    ptype      = 'type'
    pid        = 'pid'   



class FbftTopology(object):
    """
    F-BFT topology 
    """
    def __init__(self):
        self._validator_id = None
        self._nest_colour = None
        self._genesis_node = None
        self._parent = None
        self._leader = None
        self._endpoint = None
        self._arbiters = {}
        self._cluster = None
        self._topology  = None
        self._nosync = False
    @property
    def nest_colour(self):
        return self._nest_colour

    @property
    def cluster(self):
        return self._cluster

    @property
    def arbiters(self):
        return self._arbiters

    @property
    def genesis_node(self):
        return self._genesis_node if self._genesis_node else ''

    @property
    def topology(self):
        return self._topology

    def get_topology_iter_from(self,root):
        return self.get_topology_iter(root)
     
    def get_topology_iter(self, root=None):
        def iter_topology(children):
            for key,peer in children.items():
                #print("iter_topology key ",key)
                yield key,peer
                if isinstance(peer,dict) and PeerAtr.cluster in peer :
                    cluster = peer[PeerAtr.cluster]
                    if PeerAtr.name in cluster and PeerAtr.children in cluster:
                        #LOGGER.debug("iter_topology >>> %s",cluster['name'])
                        yield from iter_topology(cluster[PeerAtr.children])
                        #LOGGER.debug("iter_topology <<< %s",cluster['name'])
                        
        #check children FIXME    
        return iter_topology(self._topology[PeerAtr.children] if root is None else root)

    def __iter__(self):
        return self.get_topology_iter()

    def get_cluster_iter(self, cname):
        def iter_cluster(children):
            for key,peer in children.items():
                print("iter_cluster key ",key)
                yield key,peer
        cluster = self.get_cluster_by_name(cname)
        return iter_cluster(cluster[PeerAtr.children]) if cluster else []

    def update_peer_activity(self,peer_key,endpoint,mode,sync=False,force=False,pid=None):
        
        for key,peer in self.get_topology_iter():
            if (peer_key is not None and key == peer_key) or (PeerAtr.endpoint in peer and peer[PeerAtr.endpoint] == endpoint)  :
                if endpoint is not None:
                    peer[PeerAtr.endpoint] = endpoint
                if pid is not None:
                    peer[PeerAtr.pid] = pid
                #if sync or (not sync and (peer[PeerAtr.node_state] != PeerSync.active or force)) :
                peer[PeerAtr.node_state] = (PeerSync.active if sync else PeerSync.nosync) if mode else PeerSync.inactive
                """
                if component is not None:
                    peer[PeerAtr.component] = component
                    LOGGER.debug("UPDATE peer_component=%s  peer=%s",component,peer)
                """
                if not sync and not self._nosync:
                    self._nosync = True
                    self._topology['sync'] = not self._nosync 
                LOGGER.debug("UPDATE peer_activity: nosync=%s peer=%s",self._nosync,peer)
                return key
        return None

    def get_peer(self,peer_key):
        if peer_key in self._cluster:
            peer = self._cluster[peer_key]
            return peer
        else:
            for key,peer in self.get_topology_iter():
                if key == peer_key:
                    return peer
        return  None

    def get_peer_state(self,peer_key):
        peer = self.get_peer(peer_key)
        if peer is not None and PeerAtr.node_state in peer:
            return peer[PeerAtr.node_state]
        return  PeerSync.inactive
    def get_peer_id(self,peer_key):
        peer = self.get_peer(peer_key)
        if peer is not None and PeerAtr.pid in peer:
            return peer[PeerAtr.pid]
        return  None

    def get_cluster_by_name(self,name):
        for key,peer in self.get_topology_iter(): #self._topology): # [PeerAtr.children]
            if isinstance(peer,dict) and PeerAtr.cluster in peer :
                #print('PEE',key,type(peer),peer,type(self._topology))
                cluster = peer[PeerAtr.cluster]
                #print('CLA ',cluster[PeerAtr.name])
                if PeerAtr.name in cluster and PeerAtr.children in cluster and cluster[PeerAtr.name] == name:
                    return cluster
        return None

    def get_peer_by_name(self,cname,name):
        for key,peer in self.get_topology_iter():
            if PeerAtr.cluster in peer:
                cluster = peer[PeerAtr.cluster]
                if PeerAtr.name in cluster and PeerAtr.children in cluster and cluster[PeerAtr.name] == cname:
                    for skey,speer in cluster[PeerAtr.children].items():
                        #print('SPEER',speer,speer[PeerAtr.name] == cname)
                        if PeerAtr.name in speer and speer[PeerAtr.ptype] == 'peer' and speer[PeerAtr.name] == name:
                            return speer
        return None

    def get_peer_by_name(self,cname,name):
        for key,peer in self.get_topology_iter():
            if PeerAtr.cluster in peer:
                cluster = peer[PeerAtr.cluster]
                if PeerAtr.name in cluster and PeerAtr.children in cluster and cluster[PeerAtr.name] == cname:
                    for skey,speer in cluster[PeerAtr.children].items():
                        #print('SPEER',speer,speer[PeerAtr.name] == cname)
                        if PeerAtr.name in speer and speer[PeerAtr.ptype] == 'peer' and speer[PeerAtr.name] == name:
                            return speer
        return None

    def update_peer_component(self,peer_key,component=None):
        for key,peer in self.get_topology_iter():
            if (peer_key is not None and key == peer_key)  :
                if component is not None:
                    peer[PeerAtr.component] = component
                    LOGGER.debug("UPDATE peer_component=%s  peer=%s",component,peer)
                break


    def get_topology(self,topology,validator_id,endpoint,peering_mode='static'):
        # get topology from string

        def get_cluster_info(arbiter_id,parent_name,name,children):
            for key,peer in children.items():
                #LOGGER.debug('[%s]:child=%s val=%s',name,key[:8],val)
                if key == self._validator_id:
                    if arbiter_id is not None:
                        self._arbiters[arbiter_id] = ('arbiter',parent_name)
                    self._nest_colour = name
                    self._cluster    = children
                    self._parent     = arbiter_id
                    #  yourself 
                    peer[PeerAtr.endpoint] = endpoint
                    peer[PeerAtr.node_state] = PeerSync.active
                    LOGGER.debug('Found own NEST=%s validator_id=%s',name,self._validator_id)
                    return

                if PeerAtr.cluster in peer:
                    cluster = peer[PeerAtr.cluster]
                    if PeerAtr.name in cluster and PeerAtr.children in cluster:
                        get_cluster_info(key,name,cluster[PeerAtr.name],cluster[PeerAtr.children])
                        if self._nest_colour is not None:
                            return

        def get_arbiters(arbiter_id,name,children):
            # make ring of arbiter - add only arbiter from other cluster
            for key,peer in children.items():
                if self._nest_colour != name:
                    # check only other cluster and add delegate
                    if PeerAtr.delegate in peer:
                        self._arbiters[key] = (PeerAtr.delegate,name)
                        #if arbiter_id == self._parent:
                        #    self._leader = key

                if self._genesis_node is None and PeerAtr.genesis in peer:
                    # this is genesis node of all network
                    self._genesis_node = key
                if PeerAtr.cluster in peer:
                    cluster = peer[PeerAtr.cluster]
                    if PeerAtr.name in cluster and PeerAtr.children in cluster:
                        get_arbiters(key,cluster[PeerAtr.name],cluster[PeerAtr.children])

        #topology = json.loads(stopology)
        self._validator_id = validator_id
        self._endpoint = endpoint
        self._topology = topology
        #LOGGER.debug('get_topology=%s',topology)
        topology['topology'] = peering_mode
        topology['sync'] = not self._nosync
        if PeerAtr.name in topology and PeerAtr.children in topology:
            get_cluster_info(None,None,topology[PeerAtr.name],topology[PeerAtr.children])
        if self._nest_colour is None:
            self._nest_colour = 'Genesis'
        else:
            # get arbiters
            get_arbiters(None,topology[PeerAtr.name],topology[PeerAtr.children])
            for key,peer in self._cluster.items():
                if peer[PeerAtr.role] == PeerRole.leader:
                    self._leader = key
                    break
            # add Identity
            topology['Network'] = 'BGX TEST network'
            topology['Identity'] = {'PubKey': self._validator_id,
                                    'IP' : self._endpoint,
                                    'Cluster' : self._nest_colour,
                                    'Genesis' : self._genesis_node,
                                    'Leader'  : self._leader if self._leader else 'UNDEF',
                                    'Parent'  : self._parent if self._parent else 'UNDEF',
                                    'KYCKey'  : '0ABD7E'

            }
            LOGGER.debug('Arbiters RING=%s GENESIS=%s',self._arbiters,self.genesis_node[:8])





