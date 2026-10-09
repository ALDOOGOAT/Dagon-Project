package com.dagon.backend.service.io;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DynamicTest;
import org.junit.jupiter.api.TestFactory;
import java.util.*;
import java.util.stream.Stream;
import static org.assertj.core.api.Assertions.*;

/** Corpus de enunciados redactados como en libros y exámenes: modelo esperado (tipo, método y datos clave) y paso por el validador. */
class IoParserCorpusTest {
    static final ObjectMapper JSON = new ObjectMapper();
    record Caso(String nombre, String estado, String tipo, String metodo, String datos, String texto, String pregunta) {}
    static Caso ok(String nombre, String tipo, String metodo, String datos, String texto) { return new Caso(nombre, "listo", tipo, metodo, datos.replace('\'', '"'), texto, null); }
    static Caso no(String nombre, String estado, String pregunta, String texto) { return new Caso(nombre, estado, null, null, null, texto, pregunta); }

    // ---------------------------------------------------------------- programación lineal
    static final List<Caso> PL = List.of(
        ok("pl01 prosa A y B con utilidad por unidad", "pl", "simplex",
            "{'objetivo':'max z=5.0x1+4.0x2','restricciones':['2.0x1+1.0x2<=40.0','1.0x1+3.0x2<=45.0','x1,x2>=0']}",
            "Una empresa fabrica dos productos, A y B. Cada unidad de A requiere 2 horas de corte y 1 hora de ensamble; cada unidad de B requiere 1 hora de corte y 3 horas de ensamble. Se dispone de 40 horas de corte y 45 de ensamble a la semana. La utilidad es de $5 por unidad de A y $4 por unidad de B. Maximizar la utilidad."),
        ok("pl02 tabla con barras y disponibilidad en prosa", "pl", "simplex",
            "{'objetivo':'max z=5.0x1+4.0x2+6.0x3','restricciones':['2.0x1+1.0x2+3.0x3<=100.0','1.0x1+3.0x2+2.0x3<=120.0','x1,x2,x3>=0']}",
            """
            Una fábrica produce tres productos con los datos siguientes:
            Producto | Corte (h) | Ensamble (h) | Utilidad ($)
            P1 | 2 | 1 | 5
            P2 | 1 | 3 | 4
            P3 | 3 | 2 | 6
            Disponibilidad: 100 horas de corte y 120 horas de ensamble. Maximizar la utilidad total."""),
        ok("pl03 lista con dos puntos y demanda mínima", "pl", "simplex",
            "{'objetivo':'max z=30.0x1+50.0x2','restricciones':['2.0x1+3.0x2<=120.0','1.0x1+2.0x2<=60.0','x1>=5.0','x1,x2>=0']}",
            "Producto A: requiere 2 kg de acero y 1 hora de trabajo; utilidad $30. Producto B: requiere 3 kg de acero y 2 horas de trabajo; utilidad $50. Hay 120 kg de acero y 60 horas de trabajo disponibles. Se deben producir no menos de 5 unidades de A. Determine cuánto producir de cada uno para maximizar la utilidad."),
        ok("pl04 contribución, demanda máxima y artículos indefinidos", "pl", "simplex",
            "{'objetivo':'max z=70.0x1+50.0x2','restricciones':['4.0x1+3.0x2<=240.0','2.0x1+1.0x2<=100.0','x2<=30.0','x1,x2>=0']}",
            "Una carpintería elabora escritorios y libreros. Un escritorio necesita 4 horas de carpintería y 2 de barnizado; un librero necesita 3 horas de carpintería y 1 de barnizado. Se cuenta con 240 horas de carpintería y 100 de barnizado. La demanda máxima de libreros es de 30 unidades. La contribución es de 70 por escritorio y de 50 por librero. Maximizar la contribución total."),
        ok("pl05 mínimo, máximo y recurso a lo sumo", "pl", "simplex",
            "{'objetivo':'max z=300.0x1+200.0x2','restricciones':['3.0x1+2.0x2<=120.0','x1>=10.0','x2<=40.0','x1,x2>=0']}",
            "Una granja siembra trigo y maíz. Cada hectárea de trigo requiere 3 horas de tractor y cada hectárea de maíz 2 horas de tractor. Se pueden usar a lo sumo 120 horas de tractor. Se deben sembrar al menos 10 hectáreas de trigo y no más de 40 hectáreas de maíz. La ganancia es de 300 por hectárea de trigo y 200 por hectárea de maíz. Maximizar la ganancia."),
        ok("pl06 minimizar costo con igualdad total", "pl", "simplex",
            "{'objetivo':'min z=4.0x1+6.0x2','restricciones':['1.0x1+1.0x2=100.0','x1>=30.0','x1,x2>=0']}",
            "Una empresa mezcla dos fertilizantes F1 y F2. Cada kilo de F1 cuesta $4 y cada kilo de F2 cuesta $6. En total se deben producir exactamente 100 kilos. La mezcla debe contener como mínimo 30 kilos de F1. Minimizar el costo."),
        ok("pl07 proporción: no exceder el doble", "pl", "simplex",
            "{'objetivo':'max z=20.0x1+50.0x2','restricciones':['2.0x1+5.0x2<=400.0','-2.0x1+1.0x2<=0.0','x1,x2>=0']}",
            "Una fábrica produce sillas y mesas. Cada silla deja una utilidad de $20 y cada mesa de $50. Cada silla requiere 2 horas de armado y cada mesa 5 horas de armado; se dispone de 400 horas de armado. La cantidad de mesas no debe exceder el doble de la de sillas. Maximizar la utilidad."),
        ok("pl08 proporción: al menos la mitad", "pl", "simplex",
            "{'objetivo':'max z=3.0x1+2.0x2','restricciones':['10.0x1+5.0x2<=500.0','-0.5x1+1.0x2>=0.0','x1,x2>=0']}",
            "Una cafetería prepara café y té. Cada taza de café aporta una ganancia de $3 y cada taza de té de $2. Se dispone de 500 gramos de insumo; cada taza de café usa 10 gramos de insumo y cada taza de té usa 5 gramos de insumo. Las tazas de té deben ser al menos la mitad de las tazas de café. Maximizar la ganancia."),
        ok("pl09 presupuesto: cuesta es uso del presupuesto", "pl", "simplex",
            "{'objetivo':'max z=6.0x1+9.0x2','restricciones':['50.0x1+80.0x2<=10000.0','x1,x2>=0']}",
            "Un inversionista puede comprar acciones de dos empresas, A y B. Cada acción de A cuesta $50 y cada acción de B cuesta $80. El presupuesto disponible es de $10000. Cada acción de A genera un rendimiento de $6 y cada acción de B de $9. Maximizar el rendimiento total."),
        ok("pl10 dieta: costo mínimo con al menos", "pl", "simplex",
            "{'objetivo':'min z=2.0x1+3.0x2','restricciones':['3.0x1+1.0x2>=20.0','1.0x1+2.0x2>=15.0','x1,x2>=0']}",
            "Una dieta debe incluir dos alimentos, X y Y. Cada unidad de X cuesta $2 y contiene 3 unidades de proteína y 1 de vitamina; cada unidad de Y cuesta $3 y contiene 1 unidad de proteína y 2 de vitamina. La dieta debe contener al menos 20 unidades de proteína y al menos 15 de vitamina. Minimizar el costo."),
        ok("pl11 mezcla en tabla con requerimiento mínimo", "pl", "simplex",
            "{'objetivo':'min z=0.3x1+0.9x2','restricciones':['9.0x1+40.0x2>=200.0','2.0x1+5.0x2>=30.0','x1,x2>=0']}",
            """
            Una empresa de alimentos balanceados mezcla maíz y soya. Los datos por kilogramo son:
            Ingrediente | Costo ($) | Proteína (g) | Fibra (g)
            Maíz | 0.30 | 9 | 2
            Soya | 0.90 | 40 | 5
            Requerimiento mínimo | | 200 | 30
            Determine la mezcla de costo mínimo."""),
        ok("pl12 enteras por branch and bound", "pl", "branch_bound",
            "{'objetivo':'max z=60.0x1+40.0x2','restricciones':['4.0x1+3.0x2<=25.0','x1,x2>=0','x1,x2 enteras']}",
            "Un taller produce mesas y sillas. Cada mesa requiere 4 horas de carpintería y cada silla 3 horas de carpintería; se disponen de 25 horas de carpintería. La ganancia es de $60 por mesa y $40 por silla. Las cantidades deben ser enteras. Maximizar la ganancia."),
        ok("pl13 binarias en tabla (mochila)", "pl", "branch_bound",
            "{'objetivo':'max z=8.0x1+11.0x2+6.0x3+4.0x4','restricciones':['5.0x1+7.0x2+4.0x3+3.0x4<=14.0','x1,x2,x3,x4>=0','x1,x2,x3,x4 binarias']}",
            """
            Una empresa evalúa cuatro proyectos. Cada proyecto se realiza completo o no se realiza (variables binarias).
            Proyecto | Inversión (millones) | VPN (millones)
            P1 | 5 | 8
            P2 | 7 | 11
            P3 | 4 | 6
            P4 | 3 | 4
            El presupuesto total es de 14 millones. Maximizar el VPN total."""),
        ok("pl14 tres productos y beneficio para cada uno", "pl", "simplex",
            "{'objetivo':'max z=50.0x1+80.0x2+30.0x3','restricciones':['2.0x1+3.0x2+1.0x3<=60.0','1.0x1+2.0x2+1.0x3<=40.0','x1,x2,x3>=0']}",
            "Una panadería hornea pan, pasteles y galletas. Cada lote de pan necesita 2 kg de harina y 1 hora de horno; cada lote de pasteles necesita 3 kg de harina y 2 horas de horno; cada lote de galletas necesita 1 kg de harina y 1 hora de horno. Se pueden usar no más de 60 kg de harina y como máximo 40 horas de horno. El beneficio por lote es de $50 para el pan, $80 para los pasteles y $30 para las galletas. Maximizar el beneficio."),
        ok("pl15 tres productos con palabras y utilidad unitaria", "pl", "simplex",
            "{'objetivo':'max z=12.0x1+9.0x2','restricciones':['2.0x1+1.0x2<=14.0','1.0x1+3.0x2<=15.0','x1,x2>=0']}",
            "Una joyería fabrica anillos y collares. Cada anillo necesita dos horas de pulido y una hora de engaste; cada collar necesita una hora de pulido y tres horas de engaste. Se tienen catorce horas de pulido y quince horas de engaste. La utilidad unitaria es de 12 pesos por anillo y 9 pesos por collar. Maximizar la utilidad."),
        ok("pl16 cafetería: productos con nombre propio y sentido inferido de la utilidad", "pl", "simplex",
            "{'objetivo':'max z=50.0x1+30.0x2','restricciones':['4.0x1+3.0x2<=120.0','2.0x1+1.0x2<=50.0','x1,x2>=0']}",
            "Cada Frappuccino genera una utilidad de $50 y requiere 4 onzas de jarabe y 2 de café; cada Latte genera $30 y requiere 3 onzas de jarabe y 1 de café. El inventario diario está limitado a 120 onzas de jarabe y 50 de café."),
        ok("pl17 forma algebraica con Z mayúscula", "pl", "simplex",
            "{'objetivo':'max z=3x1+5x2','restricciones':['2x1+x2<=10','x1+3x2<=15','x1,x2>=0']}",
            "Maximizar Z = 3x1 + 5x2 sujeto a: 2x1 + x2 <= 10; x1 + 3x2 <= 15; x1, x2 >= 0"),
        ok("pl18 forma algebraica entera", "pl", "branch_bound",
            "{'objetivo':'min z=4x1+3x2','restricciones':['2x1+x2>=8','x1+2x2>=6','x1,x2>=0','x1,x2 enteras']}",
            "Minimizar Z = 4x1 + 3x2 sujeto a 2x1 + x2 >= 8, x1 + 2x2 >= 6, x1, x2 enteras"),
        ok("pl19 selección binaria con listas (canónica)", "pl", "branch_bound",
            "{'objetivo':'max z=14.0x1+10.0x2+15.0x3','restricciones':['9.0x1+6.0x2+2.0x3<=14.0','x1,x2,x3>=0','x1,x2,x3 binarias']}",
            "Una empresa evalúa 3 proyectos y cada uno se acepta completo o se rechaza (decisión de sí o no). Los beneficios son 14, 10 y 15 millones; los costos son 9, 6 y 2 millones. El presupuesto es de 14 millones. ¿Qué proyectos elegir para maximizar el beneficio?"),
        ok("pl20 cuatro inversiones con capital", "pl", "branch_bound",
            "{'objetivo':'max z=20.0x1+16.0x2+11.0x3+8.0x4','restricciones':['12.0x1+9.0x2+6.0x3+4.0x4<=20.0','x1,x2,x3,x4>=0','x1,x2,x3,x4 binarias']}",
            "Una empresa evalúa cuatro inversiones y cada una se realiza completa o no se realiza (variables binarias). Los rendimientos son 20, 16, 11 y 8 millones; las inversiones requeridas son 12, 9, 6 y 4 millones. Se dispone de un capital de 20 millones. Maximizar el rendimiento total."),
        ok("pl21 cinco opciones con VPN y 0 o 1", "pl", "branch_bound",
            "{'objetivo':'max z=30.0x1+25.0x2+18.0x3+12.0x4+9.0x5','restricciones':['20.0x1+15.0x2+10.0x3+8.0x4+4.0x5<=30.0','x1,x2,x3,x4,x5>=0','x1,x2,x3,x4,x5 binarias']}",
            "Se evalúan 5 opciones de inversión; cada opción se toma o se deja (0 o 1). El VPN de las opciones es 30, 25, 18, 12 y 9 millones y su costo es 20, 15, 10, 8 y 4 millones. El presupuesto máximo es de 30 millones. Maximizar el VPN."),
        ok("pl22 listas en otro orden y proyectos en palabras", "pl", "branch_bound",
            "{'objetivo':'max z=12.0x1+9.0x2+10.0x3+4.0x4','restricciones':['8.0x1+5.0x2+7.0x3+3.0x4<=15.0','x1,x2,x3,x4>=0','x1,x2,x3,x4 binarias']}",
            "Los costos de los cuatro proyectos son 8, 5, 7 y 3 millones y sus ganancias son 12, 9, 10 y 4 millones. Cada proyecto se acepta o se rechaza (variables binarias). El presupuesto disponible es de 15 millones. Maximizar la ganancia."));

    // ---------------------------------------------------------------- transporte y asignación
    static final List<Caso> MATRICES = List.of(
        ok("tr01 tabla con oferta y demanda", "transporte", "vogel",
            "{'costos':[[4,6,8],[5,7,9]],'oferta':[100,150],'demanda':[80,120,50]}",
            """
            Una empresa tiene dos plantas y tres clientes. Costos de transporte por unidad:
                      | Cliente 1 | Cliente 2 | Cliente 3 | Oferta
            Planta 1  |     4     |     6     |     8     |  100
            Planta 2  |     5     |     7     |     9     |  150
            Demanda   |    80     |    120    |    50     |
            Minimizar el costo total de envío."""),
        ok("tr02 filas con dos puntos y listas", "transporte", "vogel",
            "{'costos':[[8,6,10,9],[9,12,13,7],[14,9,16,5]],'oferta':[35,50,40],'demanda':[45,20,30,30]}",
            "Tres almacenes abastecen a cuatro tiendas. Los costos unitarios de envío son: Almacén 1: 8, 6, 10, 9; Almacén 2: 9, 12, 13, 7; Almacén 3: 14, 9, 16, 5. La oferta de los almacenes es 35, 50 y 40 unidades. La demanda de las tiendas es 45, 20, 30 y 30 unidades. Determinar el plan de envío de costo mínimo."),
        ok("tr03 frases: enviar de P1 a C1 cuesta", "transporte", "vogel",
            "{'costos':[[2,3,1],[5,4,3]],'oferta':[60,40],'demanda':[30,40,30]}",
            "Dos plantas (P1 y P2) abastecen a tres centros de distribución (C1, C2 y C3). La planta P1 tiene capacidad para 60 unidades y la planta P2 para 40 unidades. Los centros requieren 30, 40 y 30 unidades, respectivamente. Enviar de P1 a C1 cuesta $2, de P1 a C2 $3 y de P1 a C3 $1; enviar de P2 a C1 cuesta $5, de P2 a C2 $4 y de P2 a C3 $3. Minimizar el costo de transporte."),
        ok("tr04 tabla desbalanceada y método noroeste", "transporte", "noroeste",
            "{'costos':[[10,12],[8,9]],'oferta':[20,30],'demanda':[25,15]}",
            """
            Resuelva con la esquina noroeste el siguiente transporte:
            Origen/Destino | D1 | D2 | Capacidad
            O1 | 10 | 12 | 20
            O2 | 8 | 9 | 30
            Requerimiento | 25 | 15 |"""),
        ok("tr05 almacenes A y B hacia Norte y Sur (canónica)", "transporte", "vogel",
            "{'costos':[[6,2],[1,5]],'oferta':[15,25],'demanda':[20,20]}",
            "Una empresa distribuye productos desde dos almacenes. El almacén A dispone de 15 unidades y el B de 25 unidades. El destino Norte necesita 20 unidades y el Sur 20 unidades. Los costos por unidad son: A a Norte 6 pesos, A a Sur 2 pesos, B a Norte 1 peso, B a Sur 5 pesos. Minimizar el costo de transporte."),
        ok("tr06 tres almacenes y requiere", "transporte", "vogel",
            "{'costos':[[4,6,8],[5,3,7],[9,2,1]],'oferta':[20,30,10],'demanda':[25,15,20]}",
            "Una empresa distribuye mercancía desde tres almacenes. El almacén A dispone de 20 unidades, el B de 30 y el C de 10. El destino Norte requiere 25 unidades, el Sur 15 y el Este 20. Los costos por unidad son: A a Norte 4 pesos, A a Sur 6 pesos, A a Este 8 pesos, B a Norte 5 pesos, B a Sur 3 pesos, B a Este 7 pesos, C a Norte 9 pesos, C a Sur 2 pesos, C a Este 1 peso. Minimizar el costo de transporte."),
        ok("tr07 costos primero, plantas numeradas y ciudades", "transporte", "vogel",
            "{'costos':[[3,5],[4,2]],'oferta':[30,20],'demanda':[25,25]}",
            "Los costos por unidad son: Planta 1 a Madrid 3 pesos, Planta 1 a Lima 5 pesos, Planta 2 a Madrid 4 pesos, Planta 2 a Lima 2 pesos. La planta 1 tiene capacidad de 30 unidades y la planta 2 de 20 unidades. Madrid necesita 25 unidades y Lima 25 unidades. Minimizar el costo de envío."),
        ok("as01 asignación con barras y costo", "asignacion", "hungaro",
            "{'matriz':[[9,2,7,8],[6,4,3,7],[5,8,1,8],[7,6,9,4]],'objetivo':'min'}",
            """
            Cuatro trabajadores deben asignarse a cuatro tareas, una por trabajador. Los costos (en pesos) de cada asignación son:
            Trabajador | Tarea 1 | Tarea 2 | Tarea 3 | Tarea 4
            Ana | 9 | 2 | 7 | 8
            Beto | 6 | 4 | 3 | 7
            Carla | 5 | 8 | 1 | 8
            Diego | 7 | 6 | 9 | 4
            Minimizar el costo total."""),
        ok("as02 asignación con filas de máquinas y tiempos", "asignacion", "hungaro",
            "{'matriz':[[10,12,9],[8,15,11],[14,10,12]],'objetivo':'min'}",
            "Tres máquinas deben asignarse a tres trabajos. El tiempo en horas que tarda cada máquina en cada trabajo es: Máquina 1: 10, 12, 9; Máquina 2: 8, 15, 11; Máquina 3: 14, 10, 12. Asignar un trabajo a cada máquina para minimizar el tiempo total."),
        ok("as03 asignación maximizando ventas", "asignacion", "hungaro",
            "{'matriz':[[20,14,18,22],[17,19,15,16],[12,21,19,13],[16,15,20,18]],'objetivo':'max'}",
            """
            Cuatro vendedores serán asignados a cuatro zonas. La tabla muestra las ventas esperadas (en miles de pesos) de cada vendedor en cada zona:
            Vendedor | Norte | Sur | Este | Oeste
            Luis | 20 | 14 | 18 | 22
            María | 17 | 19 | 15 | 16
            Pedro | 12 | 21 | 19 | 13
            Sara | 16 | 15 | 20 | 18
            Se desea maximizar las ventas totales."""),
        ok("as04 asignación con filas separadas por espacios", "asignacion", "hungaro",
            "{'matriz':[[25,30,20],[28,22,26],[24,27,31]],'objetivo':'min'}",
            """
            Se tienen 3 repartidores y 3 rutas. Tiempos de entrega en minutos:
            Repartidor 1: 25 30 20
            Repartidor 2: 28 22 26
            Repartidor 3: 24 27 31
            Asigna cada repartidor a una ruta minimizando el tiempo total."""));

    // ---------------------------------------------------------------- redes y grafos
    static final List<Caso> REDES = List.of(
        ok("cp01 CPM en tabla", "redes", "cpm",
            "{'actividades':[{'id':'A','predecesoras':[],'duracion':3},{'id':'B','predecesoras':['A'],'duracion':4},{'id':'C','predecesoras':['A'],'duracion':2},{'id':'D','predecesoras':['B','C'],'duracion':5}]}",
            """
            Un proyecto tiene las siguientes actividades (duración en días):
            Actividad | Predecesoras | Duración
            A | - | 3
            B | A | 4
            C | A | 2
            D | B, C | 5
            Determine la duración del proyecto y la ruta crítica."""),
        ok("cp02 CPM en prosa: empieza cuando termina", "redes", "cpm",
            "{'actividades':[{'id':'A','predecesoras':[],'duracion':3},{'id':'B','predecesoras':['A'],'duracion':4},{'id':'C','predecesoras':['A'],'duracion':2},{'id':'D','predecesoras':['B','C'],'duracion':5}]}",
            "Un proyecto consta de cuatro actividades. La actividad A dura 3 días y puede comenzar de inmediato. La actividad B dura 4 días y empieza cuando termina A. La actividad C dura 2 días y empieza cuando termina A. La actividad D dura 5 días y empieza cuando terminan B y C. ¿Cuál es la duración mínima del proyecto?"),
        ok("cp03 PERT en tabla con plazo", "redes", "pert",
            "{'actividades':[{'id':'A','predecesoras':[],'a':2,'m':4,'b':6},{'id':'B','predecesoras':['A'],'a':3,'m':5,'b':13},{'id':'C','predecesoras':['A'],'a':1,'m':2,'b':3}],'plazo':12}",
            """
            Un proyecto tiene tres actividades con tiempos estimados en semanas:
            Actividad | Predecesoras | Optimista | Más probable | Pesimista
            A | - | 2 | 4 | 6
            B | A | 3 | 5 | 13
            C | A | 1 | 2 | 3
            ¿Cuál es la probabilidad de terminar el proyecto en 12 semanas?"""),
        ok("cp04 CPM con paréntesis y precedida por", "redes", "cpm",
            "{'actividades':[{'id':'A','predecesoras':[],'duracion':3},{'id':'B','predecesoras':['A'],'duracion':4},{'id':'C','predecesoras':['A'],'duracion':2},{'id':'D','predecesoras':['B','C'],'duracion':5}]}",
            "Actividades del proyecto: A (3 días, sin predecesoras); B (4 días, precedida por A); C (2 días, precedida por A); D (5 días, precedida por B y C). Calcula la ruta crítica."),
        ok("cp05 PERT en prosa con optimista, más probable y pesimista", "redes", "pert",
            "{'actividades':[{'id':'A','predecesoras':[],'a':2,'m':3,'b':10},{'id':'B','predecesoras':['A'],'a':4,'m':6,'b':8}],'plazo':14}",
            "El proyecto tiene dos actividades secuenciales. La actividad A no tiene predecesoras y sus tiempos son optimista 2, más probable 3 y pesimista 10 días. La actividad B, que sigue a A, tiene tiempos optimista 4, más probable 6 y pesimista 8 días. Hay un plazo de 14 días: ¿cuál es la probabilidad de cumplirlo?"),
        ok("gr01 ruta más corta con de A a B", "grafos", "ruta_corta",
            "{'aristas':[{'origen':'A','destino':'B','valor':7},{'origen':'A','destino':'C','valor':9},{'origen':'B','destino':'C','valor':10},{'origen':'B','destino':'D','valor':15},{'origen':'C','destino':'D','valor':11},{'origen':'C','destino':'E','valor':2},{'origen':'D','destino':'E','valor':6}],'origen':'A','destino':'E'}",
            "Una red de carreteras conecta cinco ciudades. Las distancias en km son: de A a B 7, de A a C 9, de B a C 10, de B a D 15, de C a D 11, de C a E 2, de D a E 6. Encuentra la ruta más corta de A a E."),
        ok("gr02 árbol de expansión mínima en tabla", "grafos", "arbol_minimo",
            "{'aristas':[{'origen':'A','destino':'B','valor':4},{'origen':'A','destino':'C','valor':3},{'origen':'B','destino':'C','valor':2},{'origen':'B','destino':'D','valor':5},{'origen':'C','destino':'D','valor':7}]}",
            """
            Se desea conectar cuatro oficinas con fibra óptica al menor costo total. Costo de instalar cada enlace posible (en miles de pesos):
            Desde | Hasta | Costo
            A | B | 4
            A | C | 3
            B | C | 2
            B | D | 5
            C | D | 7
            Encuentra el árbol de expansión mínima."""),
        ok("gr03 flujo máximo con flechas", "grafos", "flujo_maximo",
            "{'aristas':[{'origen':'S','destino':'A','valor':10},{'origen':'S','destino':'B','valor':5},{'origen':'A','destino':'B','valor':4},{'origen':'A','destino':'T','valor':7},{'origen':'B','destino':'T','valor':8}],'origen':'S','destino':'T','dirigido':true}",
            "En una red de tuberías las capacidades en litros por segundo son: S→A 10, S→B 5, A→B 4, A→T 7, B→T 8. Determina el flujo máximo desde S hasta T."),
        ok("gr04 camino más corto con guiones", "grafos", "ruta_corta",
            "{'aristas':[{'origen':'A','destino':'B','valor':4},{'origen':'A','destino':'C','valor':2},{'origen':'B','destino':'C','valor':1},{'origen':'B','destino':'D','valor':5},{'origen':'C','destino':'D','valor':8},{'origen':'C','destino':'E','valor':10},{'origen':'D','destino':'E','valor':2},{'origen':'D','destino':'F','valor':6},{'origen':'E','destino':'F','valor':3}],'origen':'A','destino':'F'}",
            "Calles y tiempos de recorrido en minutos: A-B 4, A-C 2, B-C 1, B-D 5, C-D 8, C-E 10, D-E 2, D-F 6, E-F 3. ¿Cuál es el camino más corto de A a F?"));

    // ---------------------------------------------------------------- inventarios
    static final List<Caso> INVENTARIOS = List.of(
        ok("in01 EOQ con demanda mensual convertida a anual", "inventarios", "eoq", "{'D':1200,'S':40,'H':1.5}",
            "Una tienda vende 100 unidades al mes de un producto. Cada pedido cuesta $40 y mantener una unidad en inventario cuesta $1.5 al año. Calcular el lote económico."),
        ok("in02 EOQ con demanda semanal", "inventarios", "eoq", "{'D':2600,'S':25,'H':2}",
            "La demanda semanal de un artículo es de 50 unidades. El costo de emitir una orden es de $25 y el costo anual de mantener una unidad es de $2. Determinar el tamaño óptimo de pedido."),
        ok("in03 EOQ con demanda diaria y base declarada", "inventarios", "eoq", "{'D':6000,'S':50,'H':3}",
            "La empresa trabaja 300 días al año. La demanda diaria es de 20 unidades, el costo por pedido es de $50 y el costo de mantener una unidad es de $3 por año. Calcular la cantidad económica de pedido."),
        ok("in04 faltantes planeados", "inventarios", "faltantes", "{'D':1000,'S':10,'H':0.5,'p':2}",
            "La demanda anual es de 1000 unidades, el costo por pedido es de $10 y el costo de mantener una unidad al año es de $0.5. Se permiten faltantes con un costo de $2 por unidad faltante por año."),
        ok("in05 lote de producción", "inventarios", "epq", "{'D':1000,'S':10,'H':0.5,'P':2000}",
            "Una fábrica produce un artículo a razón de 2000 unidades al año y la demanda es de 1000 unidades al año. El costo de preparar cada corrida de producción es de $10 y mantener una unidad en inventario cuesta $0.5 al año. Calcular el lote económico de producción."),
        ok("in06 descuentos: menos de y o más", "inventarios", "descuentos",
            "{'D':1000,'S':10,'i':0.1,'tramos':[{'min':0,'precio':10},{'min':500,'precio':9}]}",
            "La demanda anual de un artículo es de 1000 unidades y cada pedido cuesta $10. El costo de mantener es el 10% del precio por unidad al año. El proveedor cobra $10 por unidad si se piden menos de 500 unidades y $9 por unidad si se piden 500 unidades o más."),
        ok("in07 descuentos con tres rangos", "inventarios", "descuentos",
            "{'D':2000,'S':20,'i':0.2,'tramos':[{'min':1,'precio':5},{'min':500,'precio':4.5},{'min':1000,'precio':4}]}",
            "La demanda anual es de 2000 unidades y cada pedido cuesta $20. El costo de mantener es el 20% del precio. Los precios son: $5 por unidad para pedidos de 1 a 499 unidades, $4.5 de 500 a 999 unidades y $4 para 1000 unidades o más."),
        ok("in08 punto de reorden con nivel de servicio", "inventarios", "reorden", "{'d':20,'L':9,'sigma':4,'z':1.6449}",
            "La demanda diaria de un producto es de 20 unidades con una desviación estándar de 4 unidades al día. El tiempo de entrega del proveedor es de 9 días. Se desea un nivel de servicio del 95%. Calcular el punto de reorden."),
        ok("in09 reorden con entrega en semanas", "inventarios", "reorden", "{'d':15,'L':14,'sigma':3,'z':1.96}",
            "La demanda diaria es de 15 unidades, con desviación estándar de 3 unidades por día. El proveedor tarda 2 semanas en entregar. Con un nivel de servicio de 97.5%, ¿cuál es el punto de reorden?"),
        ok("in10 periodo fijo", "inventarios", "periodo_fijo", "{'d':10,'T':14,'L':6,'sigma':2,'z':2.3263,'inventario':120}",
            "Un almacén revisa su inventario cada 14 días. La demanda diaria promedio es de 10 unidades, con desviación estándar de 2 unidades por día. El tiempo de entrega es de 6 días y se busca un nivel de servicio de 99%. Actualmente hay 120 unidades en inventario. ¿Cuánto debe pedir en cada revisión?"));

    // ---------------------------------------------------------------- colas, Markov, decisiones, juegos
    static final List<Caso> ESTOCASTICOS = List.of(
        ok("co01 M/M/1 con tiempo medio de servicio en minutos", "colas", "mm1", "{'lambda':10,'mu':15}",
            "A un cajero automático llegan en promedio 10 clientes por hora. Cada cliente tarda en promedio 4 minutos en ser atendido. Hay un solo cajero. Las llegadas son Poisson y los tiempos de servicio son exponenciales."),
        ok("co02 M/M/s con costos", "colas", "mms", "{'lambda':18,'mu':12,'s':2,'cs':20,'cw':15}",
            "En un banco llegan 18 clientes por hora (Poisson). Hay 2 cajeros y cada cajero atiende 12 clientes por hora (exponencial). El costo de cada cajero es de $20 por hora y el costo de espera de un cliente en el sistema es de $15 por hora. Calcula las medidas de desempeño."),
        ok("co03 tiempos entre llegadas y de servicio", "colas", "mm1", "{'lambda':10,'mu':15}",
            "En una ventanilla de atención el tiempo medio entre llegadas es de 6 minutos y el tiempo medio de servicio es de 4 minutos. Hay una sola ventanilla (modelo M/M/1)."),
        ok("co04 M/M/3 por minuto", "colas", "mms", "{'lambda':2,'mu':1.5,'s':3}",
            "Un call center recibe 2 llamadas por minuto. Tiene 3 operadores y cada uno atiende 1.5 llamadas por minuto. Es un modelo M/M/3."),
        ok("mk01 matriz en tabla, inicio y pasos", "markov", "discreto", "{'P':[[0.8,0.2],[0.3,0.7]],'inicial':[1,0],'n':2}",
            """
            Un sistema tiene dos estados, A y B, con la siguiente matriz de transición:
            Estado | A | B
            A | 0.8 | 0.2
            B | 0.3 | 0.7
            Comienza en el estado A. Calcula la distribución después de 2 pasos."""),
        ok("mk02 porcentajes por marca", "markov", "discreto", "{'P':[[0.7,0.3],[0.4,0.6]],'inicial':[0.5,0.5],'n':3}",
            "En una ciudad hay dos marcas de refresco, A y B. El 70% de los clientes de A permanece con A y el 30% cambia a B cada mes. De los clientes de B, el 60% permanece en B y el 40% cambia a A. Actualmente la marca A tiene el 50% del mercado y B el 50%. ¿Qué participación tendrá cada marca después de 3 meses?"),
        ok("mk03 si hoy es soleado con probabilidad", "markov", "discreto", "{'P':[[0.9,0.1],[0.5,0.5]],'inicial':[1,0],'n':2}",
            "El clima de una ciudad se modela con una cadena de Markov con dos estados. Si hoy es soleado, mañana es soleado con probabilidad 0.9 y lluvioso con probabilidad 0.1. Si hoy es lluvioso, mañana es soleado con probabilidad 0.5 y lluvioso con probabilidad 0.5. Hoy está soleado. ¿Cuál es la distribución dentro de 2 días?"),
        ok("mk04 filas con dos puntos y tres estados", "markov", "discreto", "{'P':[[0.5,0.3,0.2],[0.2,0.6,0.2],[0.1,0.4,0.5]],'inicial':[1,0,0],'n':5}",
            "Una cadena de Markov tiene tres estados y matriz de transición: Fila 1: 0.5, 0.3, 0.2; Fila 2: 0.2, 0.6, 0.2; Fila 3: 0.1, 0.4, 0.5. Inicialmente el sistema está en el estado 1. Encuentra la distribución de probabilidad después de 5 transiciones."),
        ok("de01 incertidumbre con Hurwicz", "decisiones", "incertidumbre",
            "{'pagos':[[50,20,-10],[30,25,15],[10,10,10]],'objetivo':'max','alfa':0.6,'alternativas':['Ampliar','Mantener','Vender'],'estados':['Auge','Normal','Recesión']}",
            """
            Una empresa evalúa tres alternativas bajo incertidumbre. Ganancias (en miles de pesos) según el estado de la economía:
            Alternativa | Auge | Normal | Recesión
            Ampliar | 50 | 20 | -10
            Mantener | 30 | 25 | 15
            Vender | 10 | 10 | 10
            Aplicar el criterio de Hurwicz con α = 0.6."""),
        ok("de02 riesgo con costos y probabilidades", "decisiones", "riesgo",
            "{'pagos':[[100,150,220],[130,120,160],[180,140,130]],'objetivo':'min','probabilidades':[0.2,0.5,0.3]}",
            """
            Una tienda debe decidir cuántas unidades pedir. La tabla muestra el costo total (en pesos) según la demanda:
            Pedido | Demanda baja | Demanda media | Demanda alta
            Pedir poco | 100 | 150 | 220
            Pedir medio | 130 | 120 | 160
            Pedir mucho | 180 | 140 | 130
            Las probabilidades de demanda baja, media y alta son 0.2, 0.5 y 0.3. Minimizar el costo esperado."""),
        ok("de03 riesgo con porcentajes y filas con dos puntos", "decisiones", "riesgo",
            "{'pagos':[[80,50,10],[60,55,30],[70,40,20]],'objetivo':'max','probabilidades':[0.3,0.5,0.2]}",
            "Un agricultor elige entre sembrar maíz, frijol o soya. Las utilidades según el clima (favorable, regular, adverso) son: Maíz: 80, 50, 10; Frijol: 60, 55, 30; Soya: 70, 40, 20. Las probabilidades del clima son 30%, 50% y 20%. Elegir la alternativa de mayor utilidad esperada."),
        ok("ju01 juego de suma cero en tabla", "juegos", "suma_cero",
            "{'pagos':[[3,-1,4],[2,5,-2]],'filas':['A1','A2'],'columnas':['B1','B2','B3']}",
            """
            Dos jugadores, A y B, juegan un juego de suma cero. La matriz de pagos para A (filas) frente a B (columnas) es:
             | B1 | B2 | B3
            A1 | 3 | -1 | 4
            A2 | 2 | 5 | -2
            Determina la estrategia óptima y el valor del juego."""),
        ok("ju02 juego con filas por dos puntos", "juegos", "suma_cero", "{'pagos':[[2,-3],[-1,4]]}",
            "Dos jugadores participan en un juego de suma cero. Los pagos del jugador que elige filas son: Fila 1: 2, -3; Fila 2: -1, 4. Determina el valor del juego."),
        ok("ju03 juego 3 por 3", "juegos", "suma_cero", "{'pagos':[[4,2,5],[6,3,4],[1,7,2]]}",
            """
            Juego de suma cero. Matriz de pagos del jugador fila:
            Estrategia | Columna 1 | Columna 2 | Columna 3
            Fila 1 | 4 | 2 | 5
            Fila 2 | 6 | 3 | 4
            Fila 3 | 1 | 7 | 2
            ¿Cuál es el valor del juego?"""));

    // ---------------------------------------------------------------- no lineal y cuadrática
    static final List<Caso> NO_LINEAL = List.of(
        ok("nl01 sección dorada: máximo de x(5-x)", "noLineal", "dorada", "{'f':'x*(5-x)','a':0,'b':5,'objetivo':'max'}",
            "Maximizar f(x) = x(5 - x) en el intervalo [0, 5]."),
        ok("nl02 sección dorada: mínimo de (x-3)^2+2", "noLineal", "dorada", "{'f':'(x-3)^2+2','a':0,'b':5,'objetivo':'min'}",
            "Minimizar f(x) = (x - 3)^2 + 2 en [0, 5]."),
        ok("nl03 Lagrange: x^2+y^2 sujeto a x+y=10", "noLineal", "lagrange", "{'f':'x^2+y^2','g':'x+y','c':10}",
            "Minimizar x^2 + y^2 sujeto a x + y = 10."),
        ok("nl04 cuadrática con producto cruzado", "cuadratica", "kkt",
            "{'objetivo':'max z=15x1+30x2+4x1*x2-2x1^2-4x2^2','restricciones':['x1+2x2<=30','x1,x2>=0']}",
            "Maximizar z = 15x1 + 30x2 + 4x1x2 - 2x1^2 - 4x2^2 sujeto a x1 + 2x2 <= 30 y x1, x2 >= 0."),
        ok("nl05 Newton partiendo de x0", "noLineal", "newton", "{'f':'x^3-6*x^2+9*x+1','x0':4}",
            "Usa el método de Newton para encontrar un punto estacionario de f(x) = x^3 - 6x^2 + 9x + 1 partiendo de x0 = 4."),
        ok("nl06 cuadrática con distancias", "cuadratica", "kkt",
            "{'objetivo':'min z=(x1-2)^2+(x2-1)^2','restricciones':['x1+x2<=2','x1,x2>=0']}",
            "Minimizar z = (x1 - 2)^2 + (x2 - 1)^2 sujeto a x1 + x2 <= 2, x1, x2 >= 0."),
        ok("nl07 multivariable sin restricciones", "noLineal", "multivariable", "{'f':'x^2+y^2-4*x-6*y','simbolos':['x','y'],'inicio':[0,0],'objetivo':'min'}",
            "Minimiza f(x, y) = x^2 + y^2 - 4x - 6y partiendo del punto (0, 0)."));

    // ---------------------------------------------------------------- incompletos y no soportados
    static final String PL_BASE = "Una empresa fabrica dos productos, A y B. Cada unidad de A requiere 2 horas de corte y 1 hora de ensamble; cada unidad de B requiere 1 hora de corte y 3 horas de ensamble. Se dispone de 40 horas de corte y 45 de ensamble a la semana. La utilidad es de $5 por unidad de A y $4 por unidad de B. Maximizar la utilidad.";
    static final List<Caso> INCOMPLETOS = List.of(
        no("x01 faltan las horas disponibles", "incompleto", "corte",
            "Una empresa fabrica dos productos, A y B. Cada unidad de A requiere 2 horas de corte y cada unidad de B 1 hora de corte. La utilidad es de $5 por unidad de A y $4 por unidad de B. Maximizar la utilidad."),
        no("x02 cifra sobrante en PL", "incompleto", "500", PL_BASE + " El producto A tiene además un costo fijo de 500."),
        no("x03 minutos contra horas del mismo recurso", "incompleto", "minutos",
            PL_BASE.replace("Cada unidad de A requiere 2 horas de corte", "Cada unidad de A requiere 30 minutos de corte")),
        no("x04 falta el uso de un recurso por un producto", "incompleto", "ensamble",
            PL_BASE.replace(" y 1 hora de ensamble;", ";")),
        no("x05 monedas distintas", "incompleto", "moneda",
            PL_BASE.replace("$5 por unidad de A", "5 euros por unidad de A").replace("$4 por unidad de B", "4 dólares por unidad de B")),
        no("x06 miles ambiguos en inventario", "incompleto", "1,200",
            "La demanda anual es de 1,200 unidades, el costo por pedido es de $50 y el costo de mantener una unidad al año es de $2. Calcular el lote económico."),
        no("x07 demanda diaria sin días laborales", "incompleto", "días",
            "La demanda diaria es de 20 unidades, el costo por pedido es de $50 y el costo anual de mantener una unidad es de $3. Calcular el lote económico."),
        no("x08 tasas por día y por hora", "incompleto", "unidad",
            "Llegan 100 clientes por día y se atienden 15 clientes por hora en un servidor."),
        no("x09 fila de Markov que no suma uno", "incompleto", "suma",
            "El 70% de los clientes de A permanece con A y el 20% cambia a B. De los clientes de B, el 60% permanece en B y el 40% cambia a A. Hoy la marca A tiene el 50% del mercado y B el 50%. ¿Qué participación habrá después de 3 meses?"),
        no("x10 transporte con oferta de más filas que costos", "incompleto", "oferta",
            "Dos plantas abastecen a tres clientes. Plantas: Planta 1: 4, 6, 8; Planta 2: 5, 7, 9. La oferta es 100, 150 y 90 unidades. La demanda es 80, 120 y 50 unidades."),
        no("x11 predecesora que no existe", "incompleto", "Z",
            "Un proyecto tiene las siguientes actividades (duración en días):\nActividad | Predecesoras | Duración\nA | - | 3\nB | A | 4\nC | Z | 2\nDetermine la ruta crítica."),
        no("x12 asignación con filas de distinto tamaño", "incompleto", "rectangular",
            "Tres trabajadores y tres tareas. Costos: Trabajador 1: 9, 2, 7; Trabajador 2: 6, 4; Trabajador 3: 5, 8, 1. Minimizar el costo total."),
        no("x13 cola con prioridades", "no_soportado", null,
            "En un hospital llegan 10 pacientes por hora y se atienden 12 por hora, pero hay prioridades para casos graves y capacidad limitada de 5 camas."),
        no("x14 texto sin cifras", "no_soportado", null, "Resuelve este problema de transporte entre varias ciudades."),
        no("x15 programación dinámica", "no_soportado", null,
            "Resuelve con programación dinámica el problema de la mochila con 5 objetos de pesos 2, 3, 4, 5 y 9 y valores 3, 4, 5, 8 y 10 para una capacidad de 20."),
        no("x16 asignación sin dirección clara", "incompleto", "minimiz",
            "Tres personas y tres tareas. La tabla muestra el desempeño:\nPersona | T1 | T2 | T3\nAna | 5 | 6 | 7\nBeto | 8 | 4 | 5\nCarla | 6 | 7 | 3\nAsigna una tarea a cada persona."));

    static Stream<Caso> todos() { return Stream.of(PL, MATRICES, REDES, INVENTARIOS, ESTOCASTICOS, NO_LINEAL, INCOMPLETOS).flatMap(List::stream); }

    private final IoParserLocal parser = new IoParserLocal();
    private final IoModeloValidator validador = new IoModeloValidator();

    @TestFactory Stream<DynamicTest> corpus() {
        return todos().map(c -> DynamicTest.dynamicTest(c.nombre(), () -> verificar(c)));
    }

    private void verificar(Caso c) throws Exception {
        IoInterpretacion crudo = parser.interpretar(c.texto());
        IoInterpretacion v = validador.validar(crudo, c.texto());
        if (!c.estado().equals("listo")) {
            assertThat(v.estado()).as("estado: " + v.resumen() + " " + v.preguntas()).isEqualTo(c.estado());
            assertThat(v.modelo()).isNull();
            assertThat(v.preguntas()).isNotEmpty();
            if (c.pregunta() != null) assertThat(String.join(" ", v.preguntas()) + " " + v.resumen()).containsIgnoringCase(c.pregunta());
            return;
        }
        assertThat(crudo.estado()).as("el parser local ya debe entregar listo: " + crudo.resumen() + " " + crudo.preguntas()).isEqualTo("listo");
        assertThat(v.estado()).as("validador: " + v.resumen() + " " + v.preguntas()).isEqualTo("listo");
        assertThat(v.fuente()).isEqualTo("local");
        JsonNode m = v.modelo();
        assertThat(m.path("tipo").asText()).isEqualTo(c.tipo());
        assertThat(m.path("metodo").asText()).isEqualTo(c.metodo());
        assertThat(m.path("evidencias").size()).isGreaterThan(0);
        List<String> errores = new ArrayList<>();
        subconjunto(JSON.readTree(c.datos()), m.path("datos"), "datos", errores);
        assertThat(errores).as(m.path("datos").toString()).isEmpty();
    }

    /** El modelo real debe contener los datos esperados; los números se comparan con tolerancia y las restricciones sin orden. */
    static void subconjunto(JsonNode esperado, JsonNode real, String ruta, List<String> errores) {
        if (esperado.isObject()) {
            if (!real.isObject()) { errores.add(ruta + ": se esperaba objeto"); return; }
            esperado.fields().forEachRemaining(e -> {
                if (!real.has(e.getKey())) errores.add(ruta + "." + e.getKey() + ": falta");
                else subconjunto(e.getValue(), real.get(e.getKey()), ruta + "." + e.getKey(), errores);
            });
        } else if (esperado.isArray()) {
            if (!real.isArray() || real.size() != esperado.size()) { errores.add(ruta + ": longitud " + (real.isArray() ? real.size() : -1) + " != " + esperado.size()); return; }
            if (ruta.endsWith("restricciones")) {
                Set<String> r = new HashSet<>(); real.forEach(x -> r.add(x.asText()));
                esperado.forEach(x -> { if (!r.contains(x.asText())) errores.add(ruta + ": falta " + x.asText()); });
            } else for (int i = 0; i < esperado.size(); i++) subconjunto(esperado.get(i), real.get(i), ruta + "[" + i + "]", errores);
        } else if (esperado.isNumber()) {
            if (!real.isNumber() || Math.abs(real.asDouble() - esperado.asDouble()) > 1e-3 * Math.max(1, Math.abs(esperado.asDouble())) * 0.1) errores.add(ruta + ": " + real + " != " + esperado);
        } else if (!esperado.equals(real)) errores.add(ruta + ": " + real + " != " + esperado);
    }
}
