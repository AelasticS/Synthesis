const createNode = (name) => ({children, ...props}) => ({
    type: name,
    props,
    children,
});

const TraceModel = createNode("TraceModel");
const ModelResolution = createNode("ModelResolution");
const GlobalChoiceRef = createNode("GlobalChoiceRef");
const ElementResolution = createNode("ElementResolution");
const ElementChoiceRef = createNode("ElementChoiceRef");
const ElementMapping = createNode("ElementMapping");

const model = (
    <TraceModel
        name="CompanySchema_to_CompanyDB_trace"
        timestamp="2026-09-19T16:55:00.000Z"
        transformation="EERToRelational"
        transformationVersion="1.0.0"
        sourceVersion="commit_a1b2c3"
        source="//models/CompanySchema"
        targets={["//models/CompanyDB"]}
        config="//models/CompanyConfig"
    >
        <ModelResolution
            name="res_global_naming"
            byDefault={false}
        >
            <GlobalChoiceRef $ref="//models/CompanyConfig/gc_snake_case"/>
        </ModelResolution>

        <ElementResolution
            name="res_emp_pk"
            element="//models/CompanySchema/Employee"
            byDefault={false}
        >
            <ElementChoiceRef $ref="//models/CompanyConfig/ec_emp_pk"/>
        </ElementResolution>


        <ElementResolution
            name="res_dept_audit"
            element="//models/CompanySchema/Department"
            byDefault
        />

        <ElementResolution
            name="res_party_unmapped"
            element="//models/CompanySchema/Party"
            byDefault={false}
        >
            <ElementChoiceRef $ref="//models/CompanyConfig/ec_party_ignore"/>
        </ElementResolution>

        <ElementMapping
            name="kernelToTable_Employee"
            rule="kernelToTable"
            source="//models/CompanySchema/Employee"
            targets={["//models/CompanyDB/t_employee"]}
            resolutions={["res_emp_pk"]}
        >
            <ElementMapping
                name="columnRule_emp_id"
                rule="columnRule"
                source="//models/CompanySchema/Employee/emp_id"
                targets={["//models/CompanyDB/t_employee/col_emp_id"]}
                parentMapping="kernelToTable_Employee"
            />
        </ElementMapping>

        <ElementMapping
            name="singleTableWithDiscriminator_Manager"
            rule="singleTableWithDiscriminator"
            source="//models/CompanySchema/Manager"
            targets={["//models/CompanyDB/v_manager"]}
            resolutions={
                <ElementResolution
                    name="res_mgr_inheritance"
                    element="//models/CompanySchema/Manager"
                    byDefault={false}
                >
                    <ElementChoiceRef $ref="//models/CompanyConfig/ec_single_table"/>
                    <ElementChoiceRef $ref="//models/CompanyConfig/ec_discriminator"/>
                </ElementResolution>
            }
        />

        <ElementMapping
            name="defaultTable_Department"
            rule="defaultTable"
            source="//models/CompanySchema/Department"
            targets={["//models/CompanyDB/t_department"]}
            resolutions={["res_dept_audit"]}
        />
    </TraceModel>
);

export default model;
