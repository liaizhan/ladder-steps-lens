// LEAF scenario index for Ladder Steps: one scenario per done criterion plus an IK reach check.
import {scenariosIndex} from "Leaf.lspkg/Scenarios/decorator/ScenarioIndexDecorator"
import {ScenarioMetadata} from "Leaf.lspkg/Scenarios/scenario/ScenarioMetadata"
import {C1Geometry} from "./C1Geometry"
import {C2PickTiles} from "./C2PickTiles"
import {C3Breathing} from "./C3Breathing"
import {C4Done} from "./C4Done"
import {C5NotYet} from "./C5NotYet"
import {C6Cards} from "./C6Cards"
import {C7Arrow} from "./C7Arrow"
import {C8Storage} from "./C8Storage"
import {IKReach} from "./IKReach"

@component
export class LeafIndex extends BaseScriptComponent {
  @scenariosIndex
  static scenariosIndex: ScenarioMetadata[] = [
    {id: "C1 ladder geometry", typename: C1Geometry.getTypeName()},
    {id: "C2 pick three tiles", typename: C2PickTiles.getTypeName()},
    {id: "C3 breathing rounds", typename: C3Breathing.getTypeName()},
    {id: "C4 Done crumbles", typename: C4Done.getTypeName()},
    {id: "C5 Not yet splits", typename: C5NotYet.getTypeName()},
    {id: "C6 goal cards", typename: C6Cards.getTypeName()},
    {id: "C7 return arrow", typename: C7Arrow.getTypeName()},
    {id: "C8 persistent storage", typename: C8Storage.getTypeName()},
    {id: "IK reach tiles and Done", typename: IKReach.getTypeName()}
  ]
}
