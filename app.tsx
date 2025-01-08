import React, { useState, useEffect, useContext, createContext } from "react";
import { ResponsiveBar } from "@nivo/bar";
import { ResponsivePie } from "@nivo/pie";
import { Table, Layout, Col, Row } from "antd";
const { Header, Footer, Sider, Content } = Layout;
import { Column, Pie } from "@ant-design/plots";

// Create a context to hold filter data
const FilterContext = createContext();

const FilterProvider = ({ children }) => {
  const [filter, setFilter] = useState(null);
  return (
    <FilterContext.Provider value={{ filter, setFilter }}>
      {children}
    </FilterContext.Provider>
  );
};

const useFilter = () => {
  return useContext(FilterContext);
};

const TableData = ({ conn }) => {
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { filter } = useFilter();


  useEffect(() => {
    const fetchData = async () => {
      try {
        let query =
          'SELECT id, first_name, gender, country, salary FROM "users.parquet"';
        if (filter) {
          query += ` WHERE ` + Object.keys(filter).map((key) => `${key} = '${filter[key]}'`).join(' AND ');
        }
        const describe = await conn.query(`DESCRIBE ${query};`);
        const columns = describe.toArray().map((c) => ({
          title: c.column_name,
          dataIndex: c.column_name,
          key: c.column_name,
        }));
        setColumns(columns);
        const results = await conn.query(query);
        const data = results.toArray().map((c) => ({ ...c }));
        setData(data);
        // console.log(data, columns);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [conn, filter]);

  return (
    <Table
      dataSource={data}
      columns={columns}
      loading={loading}
      tableLayout="fixed"
      bordered={true}
      size="small"
      rowKey="id"
    />
  );
};


const AntCountryPieChart = ({ conn }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { setFilter, filter } = useFilter();


  useEffect(() => {
    const fetchData = async () => {
      try {
        let whereClause = '';
        if (filter && false) {
          whereClause = ` WHERE ` + Object.keys(filter).map((key) => `${key} = '${filter[key]}'`).join(' AND ');
        }

        let query =
          `SELECT country as id, count(*)::int as value FROM "users.parquet"
          ${whereClause}
          group by country order by value desc limit 10;`;

        const results = await conn.query(query);
        setData(results.toArray());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [conn, filter]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  const config = {
    data,
    angleField: "value",
    colorField: "id",
    legend: false,
    // interactions: [{ type: 'element-active' }], 
    labels: [
      { text: "id", style: { fontSize: 10, fontWeight: "bold" }, position: "outside" },
      { text: (d, i, data) => (i < data.length - 3 ? d.value : ""), style: { fontSize: 9 } }
    ],
    onReady: ({ chart }) => {
      chart.on('element:click', (evt) => {
        // chart.on('interval:click', (evt) => {
        const { data } = evt;
        setFilter({ country: data.data.id });
        console.log('Clicked segment data:', data.data.id);
      });
    },
  };

  return <Pie {...config} />;
};

const AntSalaryBarChart = ({ conn }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { setFilter, filter } = useFilter();


  useEffect(() => {
    const fetchData = async () => {
      try {
        let whereClause = "where salary is not null";

        if (filter) {
          whereClause += ` AND ` + Object.entries(filter).map(([key, value]) => `${key} = '${value}'`).join(' AND ');
        }

        const query =
          `SELECT gender, avg(salary) as salary FROM "users.parquet"
          ${whereClause}
          group by gender;`;

        const results = await conn.query(query);
        setData(results.toArray());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [conn, filter]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  const config = {
    data,
    xField: "gender",
    yField: "salary",
    onReady: ({ chart }) => {
      chart.on('element:click', (evt) => {
        // chart.on('interval:click', (evt) => {
        const { data } = evt;
        console.log('Clicked segment data:', data.data);
      });
    },

  };

  return <Column {...config} />;
};

const App = ({ conn }) => {
  return (
    <FilterProvider>
      <Layout>
        <Content style={{ padding: "0 50px" }}>
          <Row>
            <Col span={24}>
              <h1>Awesome Data Visualization</h1>
            </Col>
          </Row>

          <Row>
            <Col span={12} style={{ height: "300px" }}>
              <AntSalaryBarChart conn={conn} />
            </Col>

            <Col span={12} style={{ height: "300px" }}>
              <AntCountryPieChart conn={conn} />
            </Col>
          </Row>
          <Row>
            <Col span={24}>
              <TableData conn={conn} />
            </Col>
          </Row>
        </Content>
      </Layout>
    </FilterProvider>
  );
};

export default App;
