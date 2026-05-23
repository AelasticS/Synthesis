import * as t from "@aelastics/types"
import { Repository } from "../store/Repository"
import { validateConformance } from "./TypeConformance"

const TestSchema = t.schema("TypeConformanceTestSchema")

const Vehicle = t.entity(
  { vin: t.string, name: t.string },
  ["vin"] as const,
  "Vehicle",
  TestSchema,
)
const Car = t.subtype(Vehicle, { doors: t.number }, "Car", TestSchema)
const Boat = t.subtype(Vehicle, { sails: t.number }, "Boat", TestSchema)
const Truck = t.subtype(Car, { payload: t.number }, "Truck", TestSchema)

type IVehicle = t.TypeOf<typeof Vehicle>
type ICar = t.TypeOf<typeof Car>
type IBoat = t.TypeOf<typeof Boat>
type ITruck = t.TypeOf<typeof Truck>

describe("validateConformance", () => {
  const repo = new Repository<any>()

  let vehicle: IVehicle
  let car: ICar
  let truck: ITruck
  let boat: IBoat

  beforeEach(() => {
    vehicle = repo.deepCreate<IVehicle>(Vehicle, { vin: "V1", name: "v" })
    car = repo.deepCreate<ICar>(Car, { vin: "C1", name: "c", doors: 4 })
    truck = repo.deepCreate<ITruck>(Truck, {
      vin: "T1",
      name: "t",
      doors: 2,
      payload: 1000,
    })
    boat = repo.deepCreate<IBoat>(Boat, { vin: "B1", name: "b", sails: 2 })
  })

  describe("null / undefined", () => {
    it("accepts null", () => {
      expect(() => validateConformance(null, Vehicle, "x.y")).not.toThrow()
    })
    it("accepts undefined", () => {
      expect(() => validateConformance(undefined, Vehicle, "x.y")).not.toThrow()
    })
  })

  describe("exact-type match", () => {
    it("accepts a Vehicle assigned where Vehicle is expected", () => {
      expect(() =>
        validateConformance(vehicle, Vehicle, "test.exact"),
      ).not.toThrow()
    })
  })

  describe("subtype acceptance", () => {
    it("accepts a Car where Vehicle is expected (direct subtype)", () => {
      expect(() =>
        validateConformance(car, Vehicle, "test.direct-subtype"),
      ).not.toThrow()
    })
    it("accepts a Truck where Vehicle is expected (transitive subtype)", () => {
      expect(() =>
        validateConformance(truck, Vehicle, "test.transitive-subtype"),
      ).not.toThrow()
    })
    it("accepts a Truck where Car is expected", () => {
      expect(() =>
        validateConformance(truck, Car, "test.truck-as-car"),
      ).not.toThrow()
    })
  })

  describe("supertype / sibling rejection", () => {
    it("rejects a Vehicle where Car is expected (not a subtype)", () => {
      expect(() => validateConformance(vehicle, Car, "test.upcast")).toThrow(
        /test.upcast: expected .*Car.* or a subtype, got .*Vehicle/,
      )
    })
    it("rejects a Boat where Car is expected (sibling)", () => {
      expect(() => validateConformance(boat, Car, "test.sibling")).toThrow(
        /test.sibling: expected .*Car.* or a subtype, got .*Boat/,
      )
    })
  })

  describe("missing @@aelastics/type tag", () => {
    it("rejects a plain JS object", () => {
      expect(() =>
        validateConformance({ vin: "X", name: "x" }, Vehicle, "test.plain"),
      ).toThrow(/missing '@@aelastics\/type' tag/)
    })
  })

  describe("unknown tagged type", () => {
    it("rejects a value whose tagged type is not registered", () => {
      const stranger = { "@@aelastics/type": "/Nowhere/Stranger" }
      expect(() =>
        validateConformance(stranger, Vehicle, "test.unknown-type"),
      ).toThrow(/is not registered in the type system/)
    })
  })
})
