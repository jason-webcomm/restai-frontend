import { Container, Row, Form, Col, Button, InputGroup } from 'react-bootstrap';
import React, { useState, useEffect, useRef, useContext } from "react";
import { useParams } from "react-router-dom";
import { AuthContext } from '../../common/AuthProvider.js';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import { toast } from 'react-toastify';
import { MdInfoOutline } from "react-icons/md";
import { AiOutlineSave } from "react-icons/ai";


function Edit() {

  const url = process.env.REACT_APP_RESTAI_API_URL || "";
  const [data, setData] = useState({ projects: [] });
  const [info, setInfo] = useState({ "version": "", "embeddings": [], "llms": [], "loaders": [] });
  const systemForm = useRef(null);
  const connectionForm = useRef(null);
  const tablesForm = useRef(null);
  const scoreForm = useRef(null);
  const [availableLLMs, setAvailableLLMs] = useState([]);
  const kForm = useRef(null);
  const censorshipForm = useRef(null)
  const llmForm = useRef(null)
  const colbertRerankForm = useRef(null)
  const llmRerankForm = useRef(null)
  var { projectName } = useParams();
  const { getBasicAuth } = useContext(AuthContext);
  const user = getBasicAuth();

  const Link = ({ id, children, title }) => (
    <OverlayTrigger overlay={<Tooltip id={id}>{title}</Tooltip>}>
      <span style={{ fontSize: "small", margin: "3px" }}>{children}</span>
    </OverlayTrigger>
  );

  function mysqlTemplate() {
    connectionForm.current.value = "mysql+pymysql://username:password@127.0.0.1:3306/database_name"
  }

  function pgsqlTemplate() {
    connectionForm.current.value = "postgresql+psycopg2://username:password@127.0.0.1:5432/database_name"
  }

  const createSelectItems = () => {
    let items = [];
    for (let index = 0; index < availableLLMs.length; index++) {
      let llm = availableLLMs[index];
      items.push(<option key={index}>{llm}</option>);
    }
    return items;
  }

  const fetchProject = (projectName) => {
    return fetch(url + "/projects/" + projectName, { headers: new Headers({ 'Authorization': 'Basic ' + user.basicAuth }) })
      .then(function (response) {
        if (!response.ok) {
          response.json().then(function (data) {
            toast.error(data.detail);
          });
          throw Error(response.statusText);
        } else {
          return response.json();
        }
      })
      .then((d) => {
        setData(d)
      }
      ).catch(err => {
        console.log(err.toString());
        //toast.error(err.toString());
      });
  }

  const fetchInfo = () => {
    return fetch(url + "/info", { headers: new Headers({ 'Authorization': 'Basic ' + user.basicAuth }) })
      .then(function (response) {
        if (!response.ok) {
          response.json().then(function (data) {
            toast.error(data.detail);
          });
          throw Error(response.statusText);
        } else {
          return response.json();
        }
      })
      .then(function (d) {
        setInfo(d)
      }).catch(err => {
        toast.error(err.toString());
      });
  }

  // TODO: response handling
  const onSubmitHandler = (event) => {
    event.preventDefault();

    var opts = {
      "name": projectName,
      "llm": llmForm.current.value
    }

    if (data.type === "rag" || data.type === "inference" || data.type === "ragsql") {
      opts.system = systemForm.current.value
    }

    if (data.type === "ragsql") {
      opts.connection = connectionForm.current.value
      opts.tables = tablesForm.current.value
    }

    if (data.type === "rag") {
      opts.colbert_rerank = colbertRerankForm.current.checked
      opts.llm_rerank = llmRerankForm.current.checked
      opts.censorship = censorshipForm.current.value
      opts.score = parseFloat(scoreForm.current.value)
      opts.k = parseInt(kForm.current.value)

      if (opts.censorship.trim() === "") {
        delete opts.censorship;
      }
    }

    fetch(url + "/projects/" + projectName, {
      method: 'PATCH',
      headers: new Headers({ 'Content-Type': 'application/json', 'Authorization': 'Basic ' + user.basicAuth }),
      body: JSON.stringify(opts),
    })
      .then(function (response) {
        if (!response.ok) {
          response.json().then(function (data) {
            toast.error(data.detail);
          });
          throw Error(response.statusText);
        } else {
          return response.json();
        }
      })
      .then(() => {
        window.location.href = "/admin/projects/" + projectName;
      }).catch(err => {
        toast.error(err.toString());
      });

  }

  useEffect(() => {
    document.title = 'Edit - ' + projectName;
    fetchInfo();
  }, [projectName]);

  useEffect(() => {
    fetchProject(projectName);
  }, [info]);

  useEffect(() => {
    if (data.type === "rag" || data.type === "inference" || data.type === "ragsql" || data.type === "router") {
      setAvailableLLMs(info.llms.filter(llm => llm.type === "qa" || llm.type === "chat").map(llm => llm.name));
    } else if (data.type === "vision") {
      setAvailableLLMs(info.llms.filter(llm => llm.type === "vision").map(llm => llm.name));
    }

    if (data.type === "rag" && data.llm_rerank) {
      llmRerankForm.current.checked = true;
    }
    if (data.type === "rag" && data.colbert_rerank) {
      colbertRerankForm.current.checked = true;
    }
  }, [data]);

  useEffect(() => {
    llmForm.current.value = data.llm
  }, [availableLLMs]);


  return (
    <>
      <Container style={{ marginTop: "20px" }}>
        <h1>Edit Project ({projectName})</h1>
        <Form onSubmit={onSubmitHandler}>
          <Row className="mb-3">
            <Form.Group as={Col} controlId="formGridLLM">
              <Form.Label>LLM</Form.Label>
              <Form.Select ref={llmForm}>
                {createSelectItems()}
              </Form.Select>
            </Form.Group>
          </Row>
          {(data.type === "rag" || data.type === "inference" || data.type === "ragsql") &&
            <Row className="mb-3">
              <Form.Group as={Col} controlId="formGridSystem">
                <Form.Label>System Message<Link title="Instructions for the LLM know how to behave"><MdInfoOutline size="1.4em" /></Link></Form.Label>
                <Form.Control rows="2" as="textarea" ref={systemForm} defaultValue={data.system ? data.system : ""} />
              </Form.Group>
              <hr style={{ marginTop: "20px" }} />
            </Row>
          }

          {(data.type === "ragsql") &&
            <Row className="mb-3">
              <Col sm={10}>
                <Form.Group as={Col} controlId="formGridSystem">
                  <Form.Label>Connection<Link title="Connection string"><MdInfoOutline size="1.4em" /></Link></Form.Label>
                  <Form.Control rows="1" as="input" ref={connectionForm} defaultValue={data.connection ? data.connection : ""} />
                </Form.Group>
              </Col>
              <Col sm={1}>
                <InputGroup style={{ marginTop: "36px" }}>
                  <Button variant="dark" onClick={mysqlTemplate} size="sm">mySQL</Button>
                </InputGroup>
              </Col>
              <Col sm={1}>
                <InputGroup style={{ marginTop: "36px" }}>
                  <Button variant="dark" onClick={pgsqlTemplate} size="sm">PostgreSQL</Button>
                </InputGroup>
              </Col>
            </Row>
          }

          {(data.type === "ragsql") &&
            <Row className="mb-3">
              <Col sm={12}>
                <Form.Group as={Col} controlId="formGridSystem">
                  <Form.Label>Tables<Link title="Leave empty to use all tables in context, may not fit in model's context windows. Specify tables if you want to reduce the scope. Comma separated."><MdInfoOutline size="1.4em" /></Link></Form.Label>
                  <Form.Control rows="1" as="input" ref={tablesForm} defaultValue={data.tables ? data.tables : ""} />
                </Form.Group>
              </Col>
            </Row>
          }

          {data.type === "rag" &&
            <Form.Group as={Col} controlId="formGridCensorship">
              <Row className="mb-3">
                <Col sm={2}>
                  <Form.Check ref={llmRerankForm} type="checkbox" label="LLM Rerank" />
                </Col>
                <Col sm={2}>
                  <Link title="Rerank retrieval process using the LLM itself, doesn't with some LLMs."><MdInfoOutline size="1.4em" /></Link>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col sm={2}>
                  <Form.Check ref={colbertRerankForm} type="checkbox" label="Colbert Rerank" />
                </Col>
                <Col sm={2}>
                  <Link title="Colbert Rerank"><MdInfoOutline size="1.4em" /></Link>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col sm={8}>
                  <Form.Label>Censorship Message<Link title="Message that may be returned when not data is found during the retrieval process."><MdInfoOutline size="1.4em" /></Link></Form.Label>
                  <Form.Control rows="2" as="textarea" ref={censorshipForm} defaultValue={data.censorship ? data.censorship : ""} />
                </Col>
              </Row>
              <hr />
            </Form.Group>
          }

          {data.type === "rag" &&
            <Row>
              <Col sm={6}>
                <InputGroup>
                  <InputGroup.Text>Score Threshold<Link title="Minimum score acceptable to match with ingested knowledge (embeddings)"><MdInfoOutline size="1.4em" /></Link></InputGroup.Text>
                  <Form.Control ref={scoreForm} defaultValue={data.score} />
                </InputGroup>
              </Col>
              <Col sm={6}>
                <InputGroup>
                  <InputGroup.Text>k<Link title="Number of embeddings used to compute an answer"><MdInfoOutline size="1.4em" /></Link></InputGroup.Text>
                  <Form.Control ref={kForm} defaultValue={data.k} />
                </InputGroup>
              </Col>
            </Row>
          }
          <Button variant="dark" type="submit" className="mb-2" style={{ marginTop: "20px" }}><AiOutlineSave size="1.3em" /> Save</Button>
        </Form>
      </Container>
    </>
  );
}

export default Edit;